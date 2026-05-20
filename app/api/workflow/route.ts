/**
 * POST /api/workflow
 *
 * Plans a multi-agent workflow using Ollama (real LLM) and discovers
 * the best agents from Supabase for each step.
 */
import { createClient } from '@/app/_lib/supabase/server';
import { planWorkflow } from '@/app/_lib/ollama';
import { findAgentsForTask } from '@/app/_lib/discovery';
import type { Agent } from '@/app/_lib/types';

export async function POST(request: Request) {
  const body = await request.json() as { request?: string };
  const { request: userRequest } = body;

  if (!userRequest || typeof userRequest !== 'string' || userRequest.trim().length < 3) {
    return Response.json({ error: 'Missing or invalid request field' }, { status: 400 });
  }

  // 1. Plan workflow with Ollama (or keyword fallback).
  //    planWorkflow internally checks Ollama availability — no need to ping twice.
  const steps = await planWorkflow(userRequest.trim());

  // 2. Fetch all agents from Supabase, joining reputation data for accurate scoring
  const supabase = await createClient();
  const { data: agentRows, error } = await supabase
    .from('agents')
    .select(`
      *,
      reputation (
        successful_jobs,
        failed_jobs
      )
    `)
    .order('reputation', { ascending: false });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  const agents: Agent[] = (agentRows ?? []).map(row => ({
    id: row.id,
    name: row.name,
    description: row.description,
    endpoint: row.endpoint,
    supportedTasks: row.supported_tasks,
    pricing: {
      basePrice: parseFloat(row.base_price),
      perToken: parseFloat(row.per_token),
    },
    reputation: parseFloat(row.reputation),
    totalJobs: row.total_jobs,
    successfulJobs: row.reputation?.successful_jobs ?? undefined,
    failedJobs: row.reputation?.failed_jobs ?? undefined,
    ownerWallet: row.owner_wallet,
    model: row.model,
    latency: row.latency,
    createdAt: row.created_at,
  }));

  // 3. For each step, discover best agents
  const stepsWithAgents = steps.map(step => ({
    task: step.task,
    requiredAgent: step.requiredAgent,
    reasoning: step.reasoning,
    status: 'pending' as const,
    discoveredAgents: findAgentsForTask(step.task, agents),
  }));

  // Report whether Ollama was actually used (check if any step has real reasoning vs keyword fallback)
  const ollamaUsed = steps.some(s => s.reasoning && s.reasoning.length > 10);

  return Response.json({
    workflow: stepsWithAgents,
    ollamaUsed,
  });
}
