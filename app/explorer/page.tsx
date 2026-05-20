'use client';

import { useEffect, useState, useCallback } from 'react';
import type { Job, Transaction } from '@/app/_lib/types';
import TransactionFeed from '@/app/_components/TransactionFeed';
import { getAlgorandExplorerUrl } from '@/app/_lib/algorand';

const STATUS_CONFIG: Record<Job['status'], { label: string; style: React.CSSProperties }> = {
  pending:     { label: 'Pending',     style: { background: 'var(--bg-elevated)', color: 'var(--text-muted)', border: '1px solid var(--border-default)' } },
  negotiating: { label: 'Negotiating', style: { background: 'var(--amber-subtle)', color: 'var(--amber)', border: '1px solid color-mix(in srgb, var(--amber) 30%, transparent)' } },
  executing:   { label: 'Executing',   style: { background: 'var(--blue-subtle)', color: 'var(--blue)', border: '1px solid color-mix(in srgb, var(--blue) 30%, transparent)' } },
  completed:   { label: 'Completed',   style: { background: 'var(--accent-subtle)', color: 'var(--accent)', border: '1px solid color-mix(in srgb, var(--accent) 30%, transparent)' } },
  failed:      { label: 'Failed',      style: { background: 'var(--red-subtle)', color: 'var(--red)', border: '1px solid color-mix(in srgb, var(--red) 30%, transparent)' } },
};

function timeAgo(timestamp: string) {
  const diff = Date.now() - new Date(timestamp).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function truncateHash(hash: string | null) {
  if (!hash) return '—';
  return `${hash.slice(0, 8)}…${hash.slice(-6)}`;
}

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

export default function ExplorerPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchData = useCallback(async () => {
    try {
      const [txRes, jobsRes] = await Promise.all([
        fetch('/api/transactions?limit=20'),
        fetch('/api/jobs?limit=20'),
      ]);
      const [txData, jobsData] = await Promise.all([txRes.json(), jobsRes.json()]);
      setTransactions(Array.isArray(txData) ? txData : []);
      setJobs(Array.isArray(jobsData) ? jobsData : []);
      setLastRefresh(new Date());
    } catch {
      // silently fail on refresh
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [fetchData]);

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
            Transaction Explorer
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
            On-chain Activity
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)', marginTop: '0.5rem' }}>
            Live feed of agent payments and job activity on Algorand
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="live-dot" />
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>
            Auto-refreshes every 5s · {lastRefresh.toLocaleTimeString()}
          </span>
        </div>
      </div>

      {loading ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '5rem 1rem',
            gap: '0.5rem',
            color: 'var(--text-muted)',
            fontSize: '0.875rem',
          }}
        >
          <span className="spinner" />
          Loading…
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
            gap: '2rem',
          }}
        >
          {/* Transaction feed */}
          <div>
            <div className="section-label" style={{ marginBottom: '1rem' }}>
              Recent x402 Payments
            </div>
            <TransactionFeed transactions={transactions} />
          </div>

          {/* Jobs table */}
          <div>
            <div className="section-label" style={{ marginBottom: '1rem' }}>
              Recent Jobs
            </div>

            {jobs.length === 0 ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '3rem 1rem',
                  borderRadius: '12px',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-muted)',
                  fontSize: '0.875rem',
                  textAlign: 'center',
                  gap: '0.5rem',
                }}
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.4, marginBottom: '0.25rem' }}>
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                  <line x1="8" y1="21" x2="16" y2="21"/>
                  <line x1="12" y1="17" x2="12" y2="21"/>
                </svg>
                No jobs yet.
                <span style={{ fontSize: '0.8125rem' }}>Run a workflow to see activity here.</span>
              </div>
            ) : (
              <div
                className="card"
                style={{ overflow: 'hidden', padding: 0 }}
              >
                {/* Table header */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr auto auto auto',
                    padding: '0.625rem 1rem',
                    borderBottom: '1px solid var(--border-subtle)',
                    background: 'var(--bg-elevated)',
                  }}
                >
                  {['Task', 'Tx', 'USDC', 'Status'].map((h, idx) => (
                    <div
                      key={h}
                      style={{
                        fontSize: '0.6875rem',
                        fontWeight: '700',
                        letterSpacing: '0.07em',
                        textTransform: 'uppercase',
                        color: 'var(--text-muted)',
                        textAlign: idx > 1 ? 'right' : 'left',
                      }}
                    >
                      {h}
                    </div>
                  ))}
                </div>

                {/* Rows */}
                {jobs.map((job, idx) => (
                  <div
                    key={job.id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr auto auto auto',
                      alignItems: 'center',
                      padding: '0.75rem 1rem',
                      borderBottom: idx < jobs.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                      transition: 'background 0.15s',
                      background: 'var(--bg-surface)',
                      gap: '0.75rem',
                    }}
                    onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = 'var(--bg-elevated)'}
                    onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'var(--bg-surface)'}
                  >
                    {/* Task */}
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: '0.8125rem',
                          fontWeight: '500',
                          color: 'var(--text-primary)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                        title={job.task}
                      >
                        {job.task}
                      </div>
                      <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '0.125rem' }}>
                        {job.agents?.name ?? '—'} · {timeAgo(job.created_at)}
                      </div>
                    </div>

                    {/* Tx hash */}
                    <div>
                      {job.tx_hash ? (
                        <a
                          href={getAlgorandExplorerUrl(job.tx_hash)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mono-hash"
                        >
                          {truncateHash(job.tx_hash)}
                        </a>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>—</span>
                      )}
                    </div>

                    {/* Amount */}
                    <div style={{ textAlign: 'right' }}>
                      <span
                        style={{
                          fontSize: '0.8125rem',
                          fontFamily: 'JetBrains Mono, monospace',
                          fontWeight: '600',
                          color: 'var(--text-primary)',
                        }}
                      >
                        ${Number(job.payment_amount).toFixed(4)}
                      </span>
                    </div>

                    {/* Status */}
                    <div style={{ textAlign: 'right' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '9999px',
                          fontSize: '0.6875rem',
                          fontWeight: '600',
                          ...STATUS_CONFIG[job.status].style,
                        }}
                      >
                        {STATUS_CONFIG[job.status].label}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
