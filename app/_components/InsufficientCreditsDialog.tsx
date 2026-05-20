'use client';

import Link from 'next/link';

interface Props {
  requiredCredits: number;
  currentBalance: number;
  onClose: () => void;
}

export function InsufficientCreditsDialog({ requiredCredits, currentBalance, onClose }: Props) {
  const shortfall = requiredCredits - currentBalance;
  const shortfallUsdc = (shortfall / 100).toFixed(2);
  const requiredUsdc = (requiredCredits / 100).toFixed(2);

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="card"
        style={{
          width: '100%', maxWidth: '420px', padding: '2rem',
          display: 'flex', flexDirection: 'column', gap: '1.25rem',
          border: '1px solid color-mix(in srgb, var(--red) 30%, transparent)',
        }}
      >
        {/* Icon + title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
          <div style={{
            width: '44px', height: '44px', borderRadius: '50%', flexShrink: 0,
            background: 'var(--red-subtle)', border: '1px solid color-mix(in srgb, var(--red) 30%, transparent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--red)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-primary)' }}>
              Insufficient Credits
            </div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>
              You need more credits to run this task
            </div>
          </div>
        </div>

        {/* Balance breakdown */}
        <div style={{ background: 'var(--bg-elevated)', borderRadius: '10px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Your balance</span>
            <span style={{ fontWeight: '600', color: 'var(--text-primary)', fontFamily: 'JetBrains Mono, monospace' }}>
              {currentBalance.toLocaleString()} credits
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Required</span>
            <span style={{ fontWeight: '600', color: 'var(--text-primary)', fontFamily: 'JetBrains Mono, monospace' }}>
              {requiredCredits.toLocaleString()} credits (≈ ${requiredUsdc} USDC)
            </span>
          </div>
          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.625rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
            <span style={{ color: 'var(--red)', fontWeight: '600' }}>Shortfall</span>
            <span style={{ fontWeight: '700', color: 'var(--red)', fontFamily: 'JetBrains Mono, monospace' }}>
              {shortfall.toLocaleString()} credits (≈ ${shortfallUsdc} USDC)
            </span>
          </div>
        </div>

        <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: '1.6', margin: 0 }}>
          Buy at least <strong>${shortfallUsdc} USDC</strong> worth of credits to continue.
          Credits are stored on-chain and deducted automatically when tasks complete.
        </p>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={onClose}
            className="btn-ghost"
            style={{ flex: 1, borderRadius: '9999px' }}
          >
            Cancel
          </button>
          <Link
            href="/credits"
            className="btn-accent"
            style={{ flex: 2, borderRadius: '9999px', textAlign: 'center', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/>
              <path d="M12 18V6"/>
            </svg>
            Buy Credits
          </Link>
        </div>
      </div>
    </div>
  );
}
