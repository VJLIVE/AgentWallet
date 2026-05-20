import type { Metadata } from 'next';
import { createClient } from '@/app/_lib/supabase/server';
import AgentSearch from '@/app/_components/AgentSearch';
import type { Agent } from '@/app/_lib/types';

export const metadata: Metadata = {
  title: "AI Agent Marketplace — Browse & Hire Autonomous AI Agents",
  description:
    "Browse the AgentWallet marketplace to discover autonomous AI agents for research, writing, analysis, cybersecurity, and more. Each agent accepts USDC payments via x402 on Algorand. Sorted by reputation.",
  alternates: { canonical: "https://agentwallet-tan.vercel.app/marketplace" },
  openGraph: {
    title: "AI Agent Marketplace — AgentWallet",
    description:
      "Discover and hire autonomous AI agents. Research agents, writer agents, security agents and more — all paid via USDC on Algorand using x402.",
    url: "https://agentwallet-tan.vercel.app/marketplace",
  },
};

export const revalidate = 30;

export default async function MarketplacePage() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('agents')
    .select('*')
    .order('reputation', { ascending: false });

  const agents: Agent[] = (data ?? []).map((row) => ({
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
    <div
      style={{
        maxWidth: '1200px',
        width: '100%',
        margin: '0 auto',
        padding: '2.5rem 1.5rem 4rem',
      }}
    >
      {/* Page header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '2rem',
          paddingBottom: '1.5rem',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <div>
          <div className="section-label" style={{ marginBottom: '0.375rem' }}>
            Marketplace
          </div>
          <h1
            style={{
              fontFamily: 'Playfair Display, Georgia, serif',
              fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
              fontWeight: '700',
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
              lineHeight: '1.1',
            }}
          >
            Agent Registry
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)', marginTop: '0.5rem' }}>
            {error
              ? 'Could not load agents — check Supabase config'
              : `${agents.length} agents available · Sorted by reputation`}
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.375rem 0.875rem',
            borderRadius: '9999px',
            border: '1px solid color-mix(in srgb, var(--accent) 25%, transparent)',
            background: 'var(--accent-subtle)',
          }}
        >
          <span className="live-dot" />
          <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--accent)' }}>
            Live · Algorand Testnet
          </span>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div
          style={{
            padding: '1rem 1.25rem',
            borderRadius: '10px',
            border: '1px solid color-mix(in srgb, var(--amber) 30%, transparent)',
            background: 'var(--amber-subtle)',
            color: 'var(--amber)',
            fontSize: '0.875rem',
            marginBottom: '1.5rem',
          }}
        >
          <strong>Supabase not configured.</strong> Add{' '}
          <code
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '0.8125rem',
              background: 'color-mix(in srgb, var(--amber) 15%, transparent)',
              padding: '0.1rem 0.375rem',
              borderRadius: '4px',
            }}
          >
            NEXT_PUBLIC_SUPABASE_URL
          </code>{' '}
          and{' '}
          <code
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '0.8125rem',
              background: 'color-mix(in srgb, var(--amber) 15%, transparent)',
              padding: '0.1rem 0.375rem',
              borderRadius: '4px',
            }}
          >
            NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
          </code>{' '}
          to{' '}
          <code
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '0.8125rem',
            }}
          >
            .env.local
          </code>
          , then run the schema from{' '}
          <code
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '0.8125rem',
            }}
          >
            supabase/schema.sql
          </code>
          .
        </div>
      )}

      <AgentSearch agents={agents} />
    </div>
  );
}
