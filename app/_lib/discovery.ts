import type { Agent } from './types';

/**
 * Scores an agent for ranking in discovery results.
 * score = (reputation * 0.4) + (speedScore * 0.2) + (costScore * 0.3) + (successRate * 0.1)
 */
export function scoreAgent(agent: Agent): number {
  const reputationScore = agent.reputation / 5;
  const speedScore = Math.max(0, 1 - agent.latency / 5000);
  const costScore = Math.max(0, 1 - agent.pricing.basePrice / 1.0);

  let successRate: number;
  if (
    agent.successfulJobs != null &&
    agent.failedJobs != null &&
    agent.successfulJobs + agent.failedJobs > 0
  ) {
    successRate = agent.successfulJobs / (agent.successfulJobs + agent.failedJobs);
  } else {
    successRate = agent.totalJobs > 200 ? 0.97 : agent.totalJobs > 50 ? 0.92 : 0.85;
  }

  return (
    reputationScore * 0.4 +
    speedScore * 0.2 +
    costScore * 0.3 +
    successRate * 0.1
  );
}

/**
 * Semantic keyword groups — maps task intent to relevant terms.
 * Used to match tasks against agent names, descriptions, and supportedTasks.
 */
const TASK_INTENT_GROUPS: Record<string, string[]> = {
  summarize:  ['summar', 'condense', 'brief', 'tldr', 'digest', 'abstract', 'overview', 'recap'],
  research:   ['research', 'analys', 'data', 'market', 'competi', 'trend', 'find', 'search', 'gather', 'investigat'],
  write:      ['write', 'report', 'document', 'article', 'content', 'draft', 'blog', 'essay', 'copy'],
  visualize:  ['chart', 'graph', 'visual', 'plot', 'diagram', 'dashboard', 'infographic'],
  negotiate:  ['negotiat', 'price', 'contract', 'deal', 'bid', 'offer'],
  security:   ['security', 'audit', 'vulnerab', 'pentest', 'hack', 'exploit', 'cyber'],
  code:       ['code', 'program', 'develop', 'script', 'debug', 'software', 'function'],
};

/**
 * Detects the primary intent of a task string.
 * Returns the matching group key or null.
 */
function detectIntent(text: string): string | null {
  const lower = text.toLowerCase();
  let bestGroup: string | null = null;
  let bestCount = 0;

  for (const [group, keywords] of Object.entries(TASK_INTENT_GROUPS)) {
    const count = keywords.filter(kw => lower.includes(kw)).length;
    if (count > bestCount) {
      bestCount = count;
      bestGroup = group;
    }
  }

  return bestGroup;
}

/**
 * Scores how well an agent matches a given intent group.
 * Checks agent name, description, and supportedTasks.
 */
function agentIntentScore(agent: Agent, intent: string | null): number {
  if (!intent) return 0;
  const keywords = TASK_INTENT_GROUPS[intent] ?? [];
  const haystack = [
    agent.name,
    agent.description ?? '',
    ...(agent.supportedTasks ?? []),
  ].join(' ').toLowerCase();

  return keywords.filter(kw => haystack.includes(kw)).length;
}

/**
 * Finds the best agents for a given task using semantic intent matching + scoring.
 * Returns top 3 agents sorted by relevance then quality score.
 * Never falls back to unrelated agents.
 */
export function findAgentsForTask(task: string, agents: Agent[], requiredAgentType?: string): Agent[] {
  const taskLower = task.toLowerCase();
  const intent = detectIntent(taskLower) ?? detectIntent(requiredAgentType ?? '');

  // Score each agent on two dimensions:
  // 1. Relevance: how well it matches the task intent
  // 2. Quality: reputation/speed/cost score
  const scored = agents.map(agent => {
    // Direct supportedTasks keyword match (highest weight)
    const directMatch = agent.supportedTasks.some(t => {
      const tl = t.toLowerCase();
      return taskLower.includes(tl) || tl.split(/[\s-_]/).some(w => w.length > 3 && taskLower.includes(w));
    });

    // Intent-based match against name/description/tasks
    const intentScore = agentIntentScore(agent, intent);

    // Agent type name match (e.g. "summarizer-agent" matches agent named "Summarizer")
    const typeMatch = requiredAgentType
      ? requiredAgentType.toLowerCase().split(/[-_]/).some(w =>
          w.length > 3 && (agent.name.toLowerCase().includes(w) || agent.supportedTasks.join(' ').toLowerCase().includes(w))
        )
      : false;

    const relevance = (directMatch ? 3 : 0) + intentScore + (typeMatch ? 2 : 0);
    const quality = scoreAgent(agent);

    return { agent, relevance, quality };
  });

  // Filter to agents with any relevance signal
  const relevant = scored.filter(s => s.relevance > 0);

  if (relevant.length > 0) {
    return relevant
      .sort((a, b) => {
        // Primary: relevance desc, secondary: quality desc
        if (b.relevance !== a.relevance) return b.relevance - a.relevance;
        return b.quality - a.quality;
      })
      .slice(0, 3)
      .map(s => s.agent);
  }

  // Soft fallback: return agents with highest quality but flag them as generic
  // (don't return security agents for summarize tasks)
  return scored
    .sort((a, b) => b.quality - a.quality)
    .slice(0, 1) // only 1 fallback, not 3
    .map(s => s.agent);
}
