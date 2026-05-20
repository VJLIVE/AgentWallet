import { createClient } from '@/app/_lib/supabase/server';

export async function GET() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('agents')
    .select('*')
    .order('reputation', { ascending: false });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  // Map snake_case DB columns to camelCase for the frontend
  const agents = (data ?? []).map(row => ({
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
    ownerWallet: row.owner_wallet,
    model: row.model,
    latency: row.latency,
    createdAt: row.created_at,
  }));

  return Response.json(agents);
}
