import { createClient } from '@/app/_lib/supabase/server';
import AgentSearch from '@/app/_components/AgentSearch';
import type { Agent } from '@/app/_lib/types';

export const revalidate = 30; // revalidate every 30s

export default async function MarketplacePage() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('agents')
    .select('*')
    .order('reputation', { ascending: false });

  const agents: Agent[] = (data ?? []).map(row => ({
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

  return (
    <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-100">Agent Marketplace</h1>
          <p className="text-zinc-500 mt-1 text-sm">
            {error
              ? 'Could not load agents — check Supabase config'
              : `${agents.length} agents available · Sorted by reputation`}
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Live · Algorand Testnet
        </div>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-lg border border-amber-700/40 bg-amber-950/20 text-amber-400 text-sm">
          <strong>Supabase not configured.</strong> Add your{' '}
          <code className="font-mono text-xs">NEXT_PUBLIC_SUPABASE_URL</code> and{' '}
          <code className="font-mono text-xs">NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code> to{' '}
          <code className="font-mono text-xs">.env.local</code>, then run the schema from{' '}
          <code className="font-mono text-xs">supabase/schema.sql</code>.
        </div>
      )}

      <AgentSearch agents={agents} />
    </div>
  );
}
