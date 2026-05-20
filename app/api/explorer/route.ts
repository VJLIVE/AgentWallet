/**
 * POST /api/explorer
 *
 * Given a user objective:
 * 1. Uses Ollama to understand what kind of agent is needed
 * 2. Fetches all agents from Supabase
 * 3. Returns ranked candidates (cheapest capable agent first)
 */
import { createClient } from '@/app/_lib/supabase/server';
import { ollamaChat, isOllamaAvailable } from '@/app/_lib/ollama';
import type { Agent } from '@/app/_lib/types';

export async function POST(request: Request) {
  const body = await request.json() as { objective?: string };
  const { objective } = body;

  if (!objective || objective.trim().length < 3) {
    return Response.json({ error: 'Missing or too short objective' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: agentRows, error } = await supabase
    .from('agents')
    .select('*')
    .order('base_price', { ascending: true }); // cheapest first

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  const agents: Agent[] = (agentRows ?? []).map(row => ({
    id: row.id,
    name: row.name,
    description: row.description,
    endpoint: row.endpoint,
    supportedTasks: row.supported_tasks,
    pricing: { basePrice: parseFloat(row.base_price), perToken: parseFloat(row.per_token) },
    reputation: parseFloat(row.reputation),
    totalJobs: row.total_jobs,
    ownerWallet: row.owner_wallet,
    model: row.model,
    latency: row.latency,
    createdAt: row.created_at,
  }));

  // Use Ollama to score each agent's suitability for the objective
  let rankedAgents: Array<Agent & { suitabilityScore: number; reasoning: string }>;
  const ollamaAvailable = await isOllamaAvailable();

  if (ollamaAvailable && agents.length > 0) {
    const agentList = agents.map((a, i) =>
      `${i}: name="${a.name}" tasks=${JSON.stringify(a.supportedTasks)} price=$${a.pricing.basePrice} desc="${a.description?.slice(0, 80)}"`
    ).join('\n');

    const prompt = `You are an AI agent matcher. Given a user objective and a list of agents, score each agent's suitability from 0-10.

User objective: "${objective}"

Agents:
${agentList}

Respond ONLY with a JSON array of objects with index, score (0-10), and one-line reasoning.
Example: [{"index":0,"score":8,"reasoning":"Matches research tasks well"},{"index":1,"score":3,"reasoning":"Focused on writing, not research"}]`;

    try {
      const response = await ollamaChat(
        [{ role: 'user', content: prompt }],
        undefined,
        20000
      );
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const scores = JSON.parse(jsonMatch[0]) as Array<{ index: number; score: number; reasoning: string }>;
        rankedAgents = agents
          .map((agent, i) => {
            const scored = scores.find(s => s.index === i);
            return {
              ...agent,
              suitabilityScore: scored?.score ?? 0,
              reasoning: scored?.reasoning ?? 'No match data',
            };
          })
          .filter(a => a.suitabilityScore >= 4) // only capable agents
          .sort((a, b) => {
            // Primary: suitability score desc, secondary: price asc
            if (b.suitabilityScore !== a.suitabilityScore) return b.suitabilityScore - a.suitabilityScore;
            return a.pricing.basePrice - b.pricing.basePrice;
          });
      } else {
        throw new Error('No JSON in Ollama response');
      }
    } catch {
      // Fallback to keyword matching
      rankedAgents = keywordMatch(objective, agents);
    }
  } else {
    rankedAgents = keywordMatch(objective, agents);
  }

  // Always include at least the cheapest agent as fallback
  if (rankedAgents.length === 0 && agents.length > 0) {
    rankedAgents = [{
      ...agents[0],
      suitabilityScore: 5,
      reasoning: 'Best available agent by price',
    }];
  }

  return Response.json({
    objective,
    candidates: rankedAgents.slice(0, 5),
    ollamaUsed: ollamaAvailable,
    cheapestCapable: rankedAgents[0] ?? null,
  });
}

function keywordMatch(
  objective: string,
  agents: Agent[]
): Array<Agent & { suitabilityScore: number; reasoning: string }> {
  const obj = objective.toLowerCase();
  return agents
    .map(agent => {
      const taskMatch = agent.supportedTasks.some(t =>
        obj.includes(t.toLowerCase()) || t.toLowerCase().split(/[\s-]/).some(w => obj.includes(w))
      );
      const descMatch = agent.description?.toLowerCase().split(' ').some(w => w.length > 4 && obj.includes(w));
      const score = taskMatch ? 7 : descMatch ? 5 : 2;
      return {
        ...agent,
        suitabilityScore: score,
        reasoning: taskMatch
          ? `Supports tasks matching your objective`
          : descMatch
          ? `Description aligns with your objective`
          : `General purpose agent`,
      };
    })
    .filter(a => a.suitabilityScore >= 4)
    .sort((a, b) => {
      if (b.suitabilityScore !== a.suitabilityScore) return b.suitabilityScore - a.suitabilityScore;
      return a.pricing.basePrice - b.pricing.basePrice;
    });
}
