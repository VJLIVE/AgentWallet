'use client';

import { useEffect, useState } from 'react';
import { useWallet } from '@/app/_components/WalletProvider';
import { getCreditBalance, formatCredits } from '@/app/_lib/credits';
import Link from 'next/link';

export default function CreditBalanceNav() {
  const { address, isConnected } = useWallet();
  const [credits, setCredits] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (address && isConnected) {
      loadBalance();
      // Refresh balance every 30 seconds
      const interval = setInterval(loadBalance, 30000);
      // Also refresh when credits are purchased on the credits page
      window.addEventListener('credits-updated', loadBalance);
      return () => {
        clearInterval(interval);
        window.removeEventListener('credits-updated', loadBalance);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, isConnected]);

  async function loadBalance() {
    if (!address) return;
    setLoading(true);
    try {
      const balance = await getCreditBalance(address);
      setCredits(balance);
    } catch (error) {
      console.error('Error loading balance:', error);
    } finally {
      setLoading(false);
    }
  }

  if (!isConnected || !address) {
    return null;
  }

  const { usdcEquivalent } = formatCredits(credits);

  return (
    <Link
      href="/credits"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.375rem 0.875rem',
        borderRadius: '9999px',
        background: 'var(--accent-subtle)',
        border: '1px solid var(--accent-muted)',
        textDecoration: 'none',
        transition: 'all 0.15s ease',
        cursor: 'pointer',
      }}
      className="focus-ring"
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'var(--accent-muted)';
        e.currentTarget.style.borderColor = 'var(--accent)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'var(--accent-subtle)';
        e.currentTarget.style.borderColor = 'var(--accent-muted)';
      }}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="var(--accent)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" />
        <path d="M12 18V6" />
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
        <span
          style={{
            fontSize: '0.75rem',
            fontWeight: '700',
            color: 'var(--accent)',
            lineHeight: '1',
          }}
        >
          {loading ? '...' : credits.toLocaleString()}
        </span>
        <span
          style={{
            fontSize: '0.625rem',
            color: 'var(--text-tertiary)',
            lineHeight: '1',
            marginTop: '2px',
          }}
        >
          credits
        </span>
      </div>
    </Link>
  );
}
