import type { NextRequest } from 'next/server';
import { createClient } from '@/app/_lib/supabase/server';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('agents')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    return Response.json({ error: 'Agent not found' }, { status: 404 });
  }

  return Response.json({
    id: data.id,
    name: data.name,
    description: data.description,
    endpoint: data.endpoint,
    supportedTasks: data.supported_tasks,
    pricing: {
      basePrice: parseFloat(data.base_price),
      perToken: parseFloat(data.per_token),
    },
    reputation: parseFloat(data.reputation),
    totalJobs: data.total_jobs,
    ownerWallet: data.owner_wallet,
    model: data.model,
    latency: data.latency,
    createdAt: data.created_at,
  });
}
