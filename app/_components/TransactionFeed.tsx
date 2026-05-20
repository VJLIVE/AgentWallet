'use client';

import type { Transaction } from '@/app/_lib/types';

interface TransactionFeedProps {
  transactions: Transaction[];
}

function truncateHash(hash: string, chars = 8) {
  return `${hash.slice(0, chars)}...${hash.slice(-4)}`;
}

function truncateWallet(wallet: string, chars = 6) {
  if (!wallet || wallet === 'unknown') return 'unknown';
  return `${wallet.slice(0, chars)}...${wallet.slice(-4)}`;
}

function timeAgo(timestamp: string) {
  const diff = Date.now() - new Date(timestamp).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function TransactionFeed({ transactions }: TransactionFeedProps) {
  const network = process.env.NEXT_PUBLIC_ALGORAND_NETWORK ?? 'testnet';
  const explorerBase = network === 'mainnet'
    ? 'https://allo.info/tx'
    : 'https://testnet.explorer.perawallet.app/tx';

  if (transactions.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 rounded-xl border border-zinc-800 text-zinc-600 text-sm">
        No transactions yet. Run a workflow to see payments here.
      </div>
    );
  }

  return (
    <div className="flex flex-col divide-y divide-zinc-800 rounded-xl border border-zinc-800 overflow-hidden">
      {transactions.map((tx, i) => (
        <div
          key={tx.id}
          className="flex items-center gap-4 px-4 py-3 bg-zinc-900 hover:bg-zinc-800 transition-colors relative"
        >
          {i === 0 && (
            <span className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          )}
          <div className="flex-1 min-w-0 pl-2">
            <div className="flex items-center gap-2 flex-wrap">
              <a
                href={`${explorerBase}/${tx.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-xs text-emerald-400 hover:text-emerald-300 underline"
              >
                {truncateHash(tx.txHash)}
              </a>
              <span className="text-zinc-600 text-xs">•</span>
              <span className="text-zinc-500 text-xs truncate">
                {truncateWallet(tx.sender)} → {truncateWallet(tx.receiver)}
              </span>
            </div>
            <div className="text-zinc-500 text-xs mt-0.5 truncate">{tx.resource}</div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-emerald-400 font-mono text-sm font-semibold">
              ${tx.amount.toFixed(4)} USDC
            </div>
            <div className="text-zinc-600 text-xs">{timeAgo(tx.createdAt)}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
