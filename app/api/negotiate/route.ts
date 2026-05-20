/**
 * POST /api/negotiate
 *
 * Negotiates pricing between the requester and an agent.
 * Uses Ollama (deepseek-r1) for intelligent negotiation, falls back to
 * rule-based logic if Ollama is unavailable.
 */
import { createClient } from '@/app/_lib/supabase/server';
import { negotiatePrice } from '@/app/_lib/ollama';

export async function POST(request: Request) {
  const body = await request.json() as {
    agentId?: string;
    budget?: number;
  };

  const { agentId, budget } = body;

  if (!agentId || budget == null || budget <= 0) {
    return Response.json(
      { error: 'Missing required fields: agentId, budget (positive number)' },
      { status: 400 }
    );
  }

  // Fetch agent from Supabase
  const supabase = await createClient();
  const { data: agent, error } = await supabase
    .from('agents')
    .select('id, name, base_price')
    .eq('id', agentId)
    .single();

  if (error || !agent) {
    return Response.json({ error: 'Agent not found' }, { status: 404 });
  }

  const initialPrice = parseFloat(agent.base_price);

  // Run negotiation (Ollama or rule-based)
  const result = await negotiatePrice(agent.name, initialPrice, budget);

  return Response.json({
    agentId,
    agentName: agent.name,
    initialOffer: initialPrice,
    counter: result.counter,
    finalPrice: result.finalPrice,
    accepted: true,
    reasoning: result.reasoning,
  });
}
