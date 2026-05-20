import { createClient } from '@/app/_lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '20'), 100);

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  // Map snake_case DB columns to camelCase for the frontend
  const transactions = (data ?? []).map(row => ({
    id: row.id,
    txHash: row.tx_hash,
    sender: row.sender,
    receiver: row.receiver,
    amount: parseFloat(row.amount),
    asaId: row.asa_id,
    resource: row.resource,
    x402Version: row.x402_version,
    network: row.network,
    confirmed: row.confirmed,
    createdAt: row.created_at,
  }));

  return Response.json(transactions);
}
