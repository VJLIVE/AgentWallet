'use client';

import { useEffect, useState, useCallback } from 'react';
import type { Job, Transaction } from '@/app/_lib/types';
import TransactionFeed from '@/app/_components/TransactionFeed';
import { getAlgorandExplorerUrl } from '@/app/_lib/algorand';

const STATUS_STYLES: Record<Job['status'], string> = {
  pending:     'bg-zinc-800 text-zinc-400 border-zinc-700',
  negotiating: 'bg-amber-950/30 text-amber-400 border-amber-700/40',
  executing:   'bg-blue-950/30 text-blue-400 border-blue-700/40',
  completed:   'bg-emerald-950/30 text-emerald-400 border-emerald-700/40',
  failed:      'bg-red-950/30 text-red-400 border-red-700/40',
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
  return `${hash.slice(0, 8)}...${hash.slice(-6)}`;
}

// Shape returned by /api/jobs (includes joined agent name)
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
    <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-100">Transaction Explorer</h1>
          <p className="text-zinc-500 mt-1 text-sm">
            Live feed of agent payments and job activity on Algorand
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Auto-refreshes every 5s · Last: {lastRefresh.toLocaleTimeString()}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-zinc-600">
          <span className="animate-spin mr-2 inline-block">⟳</span> Loading...
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Transaction feed */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide">
              Recent x402 Payments
            </h2>
            <TransactionFeed transactions={transactions} />
          </div>

          {/* Jobs table */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide">
              Recent Jobs
            </h2>
            {jobs.length === 0 ? (
              <div className="flex items-center justify-center py-12 rounded-xl border border-zinc-800 text-zinc-600 text-sm">
                No jobs yet. Run a workflow to see activity here.
              </div>
            ) : (
              <div className="rounded-xl border border-zinc-800 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-800 bg-zinc-900">
                      <th className="text-left px-4 py-3 text-zinc-500 font-medium">Task</th>
                      <th className="text-left px-4 py-3 text-zinc-500 font-medium">Tx</th>
                      <th className="text-right px-4 py-3 text-zinc-500 font-medium">USDC</th>
                      <th className="text-right px-4 py-3 text-zinc-500 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {jobs.map((job) => (
                      <tr key={job.id} className="bg-zinc-900 hover:bg-zinc-800 transition-colors">
                        <td className="px-4 py-3">
                          <div className="text-zinc-300 truncate max-w-[160px]" title={job.task}>
                            {job.task}
                          </div>
                          <div className="text-zinc-600 text-xs">
                            {job.agents?.name ?? '—'} · {timeAgo(job.created_at)}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {job.tx_hash ? (
                            <a
                              href={getAlgorandExplorerUrl(job.tx_hash)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-mono text-xs text-emerald-400 hover:text-emerald-300 underline"
                            >
                              {truncateHash(job.tx_hash)}
                            </a>
                          ) : (
                            <span className="text-zinc-600 text-xs">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="font-mono text-zinc-300">
                            ${Number(job.payment_amount).toFixed(4)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span
                            className={`inline-block text-xs px-2 py-0.5 rounded-full border ${STATUS_STYLES[job.status]}`}
                          >
                            {job.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
