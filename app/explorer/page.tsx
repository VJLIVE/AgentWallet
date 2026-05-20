'use client';

import { useEffect, useState, useCallback } from 'react';
import type { Agent, Job, Transaction } from '@/app/_lib/types';
import TransactionFeed from '@/app/_components/TransactionFeed';
import { getAlgorandExplorerUrl } from '@/app/_lib/algorand';
import { FadeIn } from '@/app/_components/FadeIn';
import { useWallet } from '@/app/_components/WalletProvider';
import { InsufficientCreditsDialog } from '@/app/_components/InsufficientCreditsDialog';
import { getCreditBalance } from '@/app/_lib/credits';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Candidate extends Agent {
  suitabilityScore: number;
  reasoning: string;
}

interface ExplorerResult {
  objective: string;
  candidates: Candidate[];
  ollamaUsed: boolean;
  cheapestCapable: Candidate | null;
}

type ExecutionPhase = 'idle' | 'matching' | 'matched' | 'paying' | 'executing' | 'done' | 'error';

interface ExecutionState {
  phase: ExecutionPhase;
  selectedAgent: Candidate | null;
  txHash: string | null;
  result: string | null;
  error: string | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<Job['status'], { label: string; style: React.CSSProperties }> = {
  pending:     { label: 'Pending',     style: { background: 'var(--bg-elevated)', color: 'var(--text-muted)', border: '1px solid var(--border-default)' } },
  negotiating: { label: 'Negotiating', style: { background: 'var(--amber-subtle)', color: 'var(--amber)', border: '1px solid color-mix(in srgb, var(--amber) 30%, transparent)' } },
  executing:   { label: 'Executing',   style: { background: 'var(--blue-subtle)', color: 'var(--blue)', border: '1px solid color-mix(in srgb, var(--blue) 30%, transparent)' } },
  completed:   { label: 'Completed',   style: { background: 'var(--accent-subtle)', color: 'var(--accent)', border: '1px solid color-mix(in srgb, var(--accent) 30%, transparent)' } },
  failed:      { label: 'Failed',      style: { background: 'var(--red-subtle)', color: 'var(--red)', border: '1px solid color-mix(in srgb, var(--red) 30%, transparent)' } },
};

function timeAgo(ts: string) {
  const diff = Date.now() - new Date(ts).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function truncateHash(hash: string | null) {
  if (!hash) return '—';
  return `${hash.slice(0, 8)}…${hash.slice(-6)}`;
}

// ─── Score bar ────────────────────────────────────────────────────────────────

function ScoreBar({ score }: { score: number }) {
  const pct = (score / 10) * 100;
  const color = score >= 7 ? 'var(--accent)' : score >= 5 ? 'var(--amber)' : 'var(--red)';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <div style={{ flex: 1, height: '4px', borderRadius: '2px', background: 'var(--border-subtle)' }}>
        <div style={{ width: `${pct}%`, height: '100%', borderRadius: '2px', background: color, transition: 'width 0.4s ease' }} />
      </div>
      <span style={{ fontSize: '0.6875rem', fontWeight: '700', color, minWidth: '24px', textAlign: 'right' }}>
        {score}/10
      </span>
    </div>
  );
}

// ─── Agent candidate card ─────────────────────────────────────────────────────

function CandidateCard({
  agent,
  isCheapest,
  isSelected,
  onSelect,
  disabled,
}: {
  agent: Candidate;
  isCheapest: boolean;
  isSelected: boolean;
  onSelect: () => void;
  disabled: boolean;
}) {
  return (
    <div
      onClick={disabled ? undefined : onSelect}
      style={{
        padding: '1.25rem',
        borderRadius: '12px',
        border: `2px solid ${isSelected ? 'var(--accent)' : isCheapest ? 'color-mix(in srgb, var(--accent) 40%, transparent)' : 'var(--border-default)'}`,
        background: isSelected ? 'var(--accent-subtle)' : 'var(--bg-surface)',
        cursor: disabled ? 'default' : 'pointer',
        transition: 'all 0.15s ease',
        position: 'relative',
      }}
    >
      {isCheapest && (
        <div style={{
          position: 'absolute', top: '-10px', left: '12px',
          background: 'var(--accent)', color: '#fff',
          fontSize: '0.625rem', fontWeight: '700', padding: '2px 8px',
          borderRadius: '6px', letterSpacing: '0.05em', textTransform: 'uppercase',
        }}>
          Best Match · Cheapest
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '0.625rem' }}>
        <div>
          <div style={{ fontSize: '0.9375rem', fontWeight: '600', color: 'var(--text-primary)' }}>{agent.name}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontFamily: 'JetBrains Mono, monospace', marginTop: '2px' }}>
            {agent.model} · {agent.latency}ms
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--accent)' }}>
            ${agent.pricing.basePrice.toFixed(4)}
          </div>
          <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
            {Math.ceil(agent.pricing.basePrice * 100)} credits
          </div>
        </div>
      </div>

      <ScoreBar score={agent.suitabilityScore} />

      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem', fontStyle: 'italic' }}>
        {agent.reasoning}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginTop: '0.625rem' }}>
        {agent.supportedTasks.slice(0, 4).map(t => (
          <span key={t} style={{
            fontSize: '0.625rem', padding: '2px 7px', borderRadius: '9999px',
            background: 'var(--bg-elevated)', color: 'var(--text-secondary)',
            border: '1px solid var(--border-subtle)',
          }}>{t}</span>
        ))}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

interface JobRow extends Omit<Job, 'txHash' | 'resultHash' | 'result' | 'completedAt'> {
  tx_hash: string | null;
  result_hash: string | null;
  result: string | null;
  completed_at: string | null;
  requester_wallet: string;
  provider_agent_id: string;
  payment_amount: number;
  created_at: string;
  agents?: { name: string; model: string } | null;
}

const EXAMPLE_OBJECTIVES = [
  'Research the latest Algorand DeFi protocols',
  'Write a competitive analysis of AI agent marketplaces',
  'Summarize recent developments in autonomous AI',
  'Analyze and visualize blockchain transaction trends',
];

export default function ExplorerPage() {
  const { address } = useWallet();

  // Objective flow state
  const [objective, setObjective] = useState('');
  const [matchResult, setMatchResult] = useState<ExplorerResult | null>(null);
  const [exec, setExec] = useState<ExecutionState>({
    phase: 'idle', selectedAgent: null, txHash: null, result: null, error: null,
  });

  // Live feed state
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [feedLoading, setFeedLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // ── Live feed ──────────────────────────────────────────────────────────────
  const fetchFeed = useCallback(async () => {
    try {
      const [txRes, jobsRes] = await Promise.all([
        fetch('/api/transactions?limit=20'),
        fetch('/api/jobs?limit=20'),
      ]);
      const [txData, jobsData] = await Promise.all([txRes.json(), jobsRes.json()]);
      setTransactions(Array.isArray(txData) ? txData : []);
      setJobs(Array.isArray(jobsData) ? jobsData : []);
      setLastRefresh(new Date());
    } catch { /* silent */ } finally {
      setFeedLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeed();
    const iv = setInterval(fetchFeed, 5000);
    return () => clearInterval(iv);
  }, [fetchFeed]);

  // ── Objective matching ─────────────────────────────────────────────────────
  async function handleMatch() {
    if (!objective.trim()) return;
    setMatchResult(null);
    setExec({ phase: 'matching', selectedAgent: null, txHash: null, result: null, error: null });

    try {
      const res = await fetch('/api/explorer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ objective }),
      });
      if (!res.ok) throw new Error(`API error ${res.status}`);
      const data = await res.json() as ExplorerResult;
      setMatchResult(data);
      // Auto-select cheapest capable agent
      setExec(prev => ({
        ...prev,
        phase: 'matched',
        selectedAgent: data.cheapestCapable,
      }));
    } catch (err) {
      setExec({ phase: 'error', selectedAgent: null, txHash: null, result: null, error: String(err) });
    }
  }

  // ── Execute with x402 ─────────────────────────────────────────────────────
  async function handleExecute() {
    const agent = exec.selectedAgent;
    if (!agent) return;

    setExec(prev => ({ ...prev, phase: 'paying', error: null }));

    try {
      // 1. Pay via x402
      const payRes = await fetch('/api/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: agent.id,
          resource: `/api/execute/${objective.replace(/\s+/g, '-').toLowerCase().slice(0, 40)}`,
          senderAddress: address ?? undefined,
          negotiatedPrice: agent.pricing.basePrice,
        }),
      });
      if (!payRes.ok) {
        const err = await payRes.json() as { error: string };
        throw new Error(err.error ?? 'Payment failed');
      }
      const payResult = await payRes.json() as { txHash: string };

      setExec(prev => ({ ...prev, phase: 'executing', txHash: payResult.txHash }));

      // 2. Execute task
      const execRes = await fetch('/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: agent.id,
          task: objective,
          txHash: payResult.txHash,
          requesterWallet: address ?? 'unknown',
        }),
      });
      if (!execRes.ok) throw new Error(`Execute error ${execRes.status}`);
      const execData = await execRes.json() as { result: string };

      setExec(prev => ({ ...prev, phase: 'done', result: execData.result }));
      fetchFeed(); // refresh live feed
    } catch (err) {
      setExec(prev => ({ ...prev, phase: 'error', error: String(err) }));
    }
  }

  function reset() {
    setObjective('');
    setMatchResult(null);
    setExec({ phase: 'idle', selectedAgent: null, txHash: null, result: null, error: null });
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: '1200px', width: '100%', margin: '0 auto', padding: '2.5rem 1.5rem 4rem' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
        <div>
          <div className="section-label" style={{ marginBottom: '0.375rem' }}>Explorer</div>
          <h1 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: '700', color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: '1.1' }}>
            Find & Execute Agents
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)', marginTop: '0.5rem' }}>
            Describe your objective — Ollama matches the best agent, picks the cheapest, and executes via x402
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="live-dot" />
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>
            Live · {lastRefresh.toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* Objective input */}
      <FadeIn>
        <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
          <div style={{ fontSize: '0.8125rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
            Describe your objective
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <input
              type="text"
              value={objective}
              onChange={e => setObjective(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && exec.phase === 'idle' && handleMatch()}
              placeholder="e.g. Research the latest Algorand DeFi protocols…"
              disabled={exec.phase !== 'idle' && exec.phase !== 'error'}
              className="input focus-ring"
              style={{ flex: 1 }}
            />
            {exec.phase === 'idle' || exec.phase === 'error' ? (
              <button onClick={handleMatch} disabled={!objective.trim()} className="btn-primary" style={{ borderRadius: '8px', flexShrink: 0 }}>
                Find Agents →
              </button>
            ) : exec.phase === 'done' ? (
              <button onClick={reset} className="btn-ghost" style={{ borderRadius: '8px', flexShrink: 0 }}>
                New Search
              </button>
            ) : (
              <button disabled className="btn-primary" style={{ borderRadius: '8px', flexShrink: 0, opacity: 0.6 }}>
                <span className="spinner" style={{ width: '12px', height: '12px', borderWidth: '1.5px' }} />
                {exec.phase === 'matching' ? 'Matching…' : exec.phase === 'paying' ? 'Paying…' : 'Executing…'}
              </button>
            )}
          </div>

          {/* Example chips */}
          {(exec.phase === 'idle' || exec.phase === 'error') && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.75rem' }}>
              {EXAMPLE_OBJECTIVES.map(ex => (
                <button key={ex} type="button" onClick={() => setObjective(ex)}
                  style={{ padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.75rem', border: '1px solid var(--border-default)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', transition: 'all 0.15s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-elevated)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)'; }}
                >{ex}</button>
              ))}
            </div>
          )}
        </div>
      </FadeIn>

      {/* Error */}
      {exec.error && (
        <FadeIn>
          <div style={{ padding: '0.875rem 1.25rem', borderRadius: '10px', border: '1px solid var(--red)', background: 'var(--red-subtle)', color: 'var(--red)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
            {exec.error}
          </div>
        </FadeIn>
      )}

      {/* Matching spinner */}
      {exec.phase === 'matching' && (
        <FadeIn>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', marginBottom: '1.5rem' }}>
            <span className="spinner" />
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Asking Ollama to match agents for your objective…
            </span>
          </div>
        </FadeIn>
      )}

      {/* Candidates */}
      {matchResult && exec.phase !== 'idle' && (
        <FadeIn>
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div className="section-label">
                {matchResult.candidates.length} capable agent{matchResult.candidates.length !== 1 ? 's' : ''} found
                {matchResult.ollamaUsed && <span style={{ marginLeft: '0.5rem', color: 'var(--accent)', fontWeight: '400' }}>· matched by Ollama</span>}
              </div>
              {exec.phase === 'matched' && exec.selectedAgent && (
                <button onClick={handleExecute} className="btn-accent" style={{ borderRadius: '9999px' }}>
                  ⚡ Execute · ${exec.selectedAgent.pricing.basePrice.toFixed(4)} ({Math.ceil(exec.selectedAgent.pricing.basePrice * 100)} credits)
                </button>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
              {matchResult.candidates.map(agent => (
                <CandidateCard
                  key={agent.id}
                  agent={agent}
                  isCheapest={agent.id === matchResult.cheapestCapable?.id}
                  isSelected={exec.selectedAgent?.id === agent.id}
                  onSelect={() => setExec(prev => ({ ...prev, selectedAgent: agent }))}
                  disabled={exec.phase !== 'matched'}
                />
              ))}
            </div>
          </div>
        </FadeIn>
      )}

      {/* Execution status */}
      {(exec.phase === 'paying' || exec.phase === 'executing') && (
        <FadeIn>
          <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem', border: '1px solid color-mix(in srgb, var(--accent) 30%, transparent)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span className="spinner" />
              <div>
                <div style={{ fontSize: '0.9375rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                  {exec.phase === 'paying' ? '⛓️ Settling x402 payment on Algorand…' : '🤖 Executing task via Ollama…'}
                </div>
                {exec.txHash && (
                  <a href={getAlgorandExplorerUrl(exec.txHash)} target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: '0.75rem', color: 'var(--accent)', fontFamily: 'JetBrains Mono, monospace' }}>
                    tx: {exec.txHash.slice(0, 16)}… →
                  </a>
                )}
              </div>
            </div>
          </div>
        </FadeIn>
      )}

      {/* Result */}
      {exec.phase === 'done' && exec.result && (
        <FadeIn>
          <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem', border: '1px solid color-mix(in srgb, var(--accent) 30%, transparent)', background: 'color-mix(in srgb, var(--accent) 3%, var(--bg-surface))' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '1rem', color: 'var(--accent)', fontWeight: '600' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20,6 9,17 4,12"/></svg>
              Task Complete · {exec.selectedAgent?.name}
              {exec.txHash && (
                <a href={getAlgorandExplorerUrl(exec.txHash)} target="_blank" rel="noopener noreferrer"
                  style={{ marginLeft: 'auto', fontSize: '0.75rem', fontFamily: 'JetBrains Mono, monospace', color: 'var(--accent)', textDecoration: 'underline' }}>
                  View tx →
                </a>
              )}
            </div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: '1.7', whiteSpace: 'pre-wrap', maxHeight: '400px', overflowY: 'auto', fontFamily: 'JetBrains Mono, monospace' }}>
              {exec.result}
            </div>
          </div>
        </FadeIn>
      )}

      {/* Live feed */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '2rem' }}>
        {/* Transactions */}
        <div>
          <div className="section-label" style={{ marginBottom: '1rem' }}>Recent x402 Payments</div>
          {feedLoading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              <span className="spinner" /> Loading…
            </div>
          ) : (
            <TransactionFeed transactions={transactions} />
          )}
        </div>

        {/* Jobs */}
        <div>
          <div className="section-label" style={{ marginBottom: '1rem' }}>Recent Jobs</div>
          {feedLoading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              <span className="spinner" /> Loading…
            </div>
          ) : jobs.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 1rem', borderRadius: '12px', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: '0.875rem', textAlign: 'center', gap: '0.5rem' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.4 }}>
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
              </svg>
              No jobs yet.
              <span style={{ fontSize: '0.8125rem' }}>Run an objective above to see activity here.</span>
            </div>
          ) : (
            <div className="card" style={{ overflow: 'hidden', padding: 0 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto auto', padding: '0.625rem 1rem', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-elevated)' }}>
                {['Task', 'Tx', 'USDC', 'Credits', 'Status'].map((h, i) => (
                  <div key={h} style={{ fontSize: '0.6875rem', fontWeight: '700', letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text-muted)', textAlign: i > 1 ? 'right' : 'left' }}>{h}</div>
                ))}
              </div>
              {jobs.map((job, idx) => (
                <div key={job.id}
                  style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto auto', alignItems: 'center', padding: '0.75rem 1rem', borderBottom: idx < jobs.length - 1 ? '1px solid var(--border-subtle)' : 'none', background: 'var(--bg-surface)', gap: '0.75rem', transition: 'background 0.15s' }}
                  onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = 'var(--bg-elevated)'}
                  onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'var(--bg-surface)'}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '0.8125rem', fontWeight: '500', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={job.task}>{job.task}</div>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '0.125rem' }}>{job.agents?.name ?? '—'} · {timeAgo(job.created_at)}</div>
                  </div>
                  <div>
                    {job.tx_hash ? (
                      <a href={getAlgorandExplorerUrl(job.tx_hash)} target="_blank" rel="noopener noreferrer" className="mono-hash">{truncateHash(job.tx_hash)}</a>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>—</span>
                    )}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.8125rem', fontFamily: 'JetBrains Mono, monospace', fontWeight: '600', color: 'var(--text-primary)' }}>${Number(job.payment_amount).toFixed(4)}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.75rem', fontFamily: 'JetBrains Mono, monospace', fontWeight: '600', color: 'var(--accent)' }}>{Math.ceil(Number(job.payment_amount) * 100)}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '0.2rem 0.5rem', borderRadius: '9999px', fontSize: '0.6875rem', fontWeight: '600', ...STATUS_CONFIG[job.status].style }}>
                      {STATUS_CONFIG[job.status].label}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
