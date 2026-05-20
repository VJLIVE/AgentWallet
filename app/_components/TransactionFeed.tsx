'use client';

import type { Transaction } from '@/app/_lib/types';

interface TransactionFeedProps {
  transactions: Transaction[];
}

function truncateHash(hash: string, chars = 8) {
  return `${hash.slice(0, chars)}…${hash.slice(-4)}`;
}

function truncateWallet(wallet: string, chars = 6) {
  if (!wallet || wallet === 'unknown') return 'unknown';
  return `${wallet.slice(0, chars)}…${wallet.slice(-4)}`;
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
  const explorerBase =
    network === 'mainnet'
      ? 'https://allo.info/tx'
      : 'https://testnet.explorer.perawallet.app/tx';

  if (transactions.length === 0) {
    return (
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
          <line x1="12" y1="1" x2="12" y2="23"/>
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
        </svg>
        No transactions yet.
        <span style={{ fontSize: '0.8125rem' }}>Run a workflow to see payments here.</span>
      </div>
    );
  }

  return (
    <div
      className="card"
      style={{ overflow: 'hidden', padding: 0 }}
    >
      {transactions.map((tx, i) => (
        <div
          key={tx.id}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.875rem',
            padding: '0.875rem 1rem',
            borderBottom: i < transactions.length - 1 ? '1px solid var(--border-subtle)' : 'none',
            background: 'var(--bg-surface)',
            position: 'relative',
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = 'var(--bg-elevated)'}
          onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'var(--bg-surface)'}
        >
          {/* Left accent — newest pulse */}
          <div
            style={{
              width: '3px',
              height: '100%',
              position: 'absolute',
              left: 0,
              top: 0,
              background: i === 0 ? 'var(--accent)' : 'transparent',
              borderRadius: '0 2px 2px 0',
              transition: 'background 0.3s',
            }}
          />

          {/* Icon */}
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: i === 0 ? 'var(--accent-subtle)' : 'var(--bg-elevated)',
              border: '1px solid',
              borderColor: i === 0
                ? 'color-mix(in srgb, var(--accent) 25%, transparent)'
                : 'var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              color: i === 0 ? 'var(--accent)' : 'var(--text-muted)',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23"/>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
          </div>

          {/* Content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <a
                href={`${explorerBase}/${tx.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mono-hash"
              >
                {truncateHash(tx.txHash)}
              </a>
              <span style={{ color: 'var(--border-strong)', fontSize: '0.6875rem' }}>·</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {truncateWallet(tx.sender)} → {truncateWallet(tx.receiver)}
              </span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {tx.resource}
            </div>
          </div>

          {/* Amount + time */}
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div
              style={{
                fontSize: '0.875rem',
                fontFamily: 'JetBrains Mono, monospace',
                fontWeight: '700',
                color: 'var(--accent)',
                lineHeight: '1.2',
              }}
            >
              ${tx.amount.toFixed(4)}
            </div>
            <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '0.125rem' }}>
              {timeAgo(tx.createdAt)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
