import type { Agent } from './types';

/**
 * Scores an agent for ranking in discovery results.
 * score = (reputation * 0.4) + (speedScore * 0.2) + (costScore * 0.3) + (successRate * 0.1)
 */
export function scoreAgent(agent: Agent): number {
  const reputationScore = agent.reputation / 5;
  const speedScore = Math.max(0, 1 - agent.latency / 5000);
  // Scale cost score against $1 USDC max — agents under $0.10 score near 1.0
  const costScore = Math.max(0, 1 - agent.pricing.basePrice / 1.0);

  // Use real reputation data when available, otherwise estimate from job count
  let successRate: number;
  if (
    agent.successfulJobs != null &&
    agent.failedJobs != null &&
    agent.successfulJobs + agent.failedJobs > 0
  ) {
    successRate = agent.successfulJobs / (agent.successfulJobs + agent.failedJobs);
  } else {
    // Fallback estimate from total job count
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
 * Finds the best agents for a given task using keyword matching + scoring.
 * Returns top 3 agents sorted by score descending.
 */
export function findAgentsForTask(task: string, agents: Agent[]): Agent[] {
  const taskLower = task.toLowerCase();

  const scored = agents
    .filter(agent =>
      agent.supportedTasks.some(t =>
        taskLower.includes(t.toLowerCase()) ||
        t.toLowerCase().includes(taskLower.split(' ')[0])
      )
    )
    .map(agent => ({ agent, score: scoreAgent(agent) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(({ agent }) => agent);

  // If no match, return top 3 by score overall
  if (scored.length === 0) {
    return agents
      .map(agent => ({ agent, score: scoreAgent(agent) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(({ agent }) => agent);
  }

  return scored;
}
