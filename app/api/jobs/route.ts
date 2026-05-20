import { createClient } from '@/app/_lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const wallet = searchParams.get('wallet');
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '20'), 100);

  const supabase = await createClient();

  let query = supabase
    .from('jobs')
    .select(`
      id,
      requester_wallet,
      provider_agent_id,
      task,
      payment_amount,
      status,
      tx_hash,
      result_hash,
      created_at,
      completed_at,
      agents (name, model)
    `)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (wallet) {
    query = query.eq('requester_wallet', wallet);
  }

  const { data, error } = await query;

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json(data ?? []);
}
