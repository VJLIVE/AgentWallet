'use client';

import { useWallet } from './WalletProvider';

export function ConnectWalletButton() {
  const { address, isConnected, isConnecting, connect, disconnect, error } = useWallet();

  const shortAddress = address
    ? `${address.slice(0, 4)}…${address.slice(-4)}`
    : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
      <button
        id="connect-wallet-btn"
        onClick={isConnected ? disconnect : connect}
        disabled={isConnecting}
        className="focus-ring"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.4rem 0.875rem',
          borderRadius: '9999px',
          fontSize: '0.8125rem',
          fontWeight: '600',
          border: '1px solid',
          cursor: isConnecting ? 'not-allowed' : 'pointer',
          opacity: isConnecting ? 0.6 : 1,
          transition: 'all 0.15s ease',
          background: isConnected ? 'var(--accent-subtle)' : 'var(--text-primary)',
          borderColor: isConnected
            ? 'color-mix(in srgb, var(--accent) 30%, transparent)'
            : 'var(--text-primary)',
          color: isConnected ? 'var(--accent)' : 'var(--bg-base)',
          whiteSpace: 'nowrap',
        }}
      >
        {isConnecting ? (
          <>
            <span className="spinner" style={{ width: '12px', height: '12px', borderWidth: '1.5px' }} />
            Connecting…
          </>
        ) : isConnected ? (
          <>
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: 'var(--accent)',
                flexShrink: 0,
              }}
            />
            {shortAddress}
          </>
        ) : (
          <>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
            </svg>
            Connect Wallet
          </>
        )}
      </button>

      {error && (
        <p style={{ fontSize: '0.6875rem', color: 'var(--red)', maxWidth: '200px', textAlign: 'right' }}>
          {error}
        </p>
      )}
    </div>
  );
}
