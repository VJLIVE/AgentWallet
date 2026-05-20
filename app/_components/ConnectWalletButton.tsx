'use client';

import { useState, useRef, useEffect } from 'react';
import { useWallet } from './WalletProvider';

export function ConnectWalletButton() {
  const { address, isConnected, isConnecting, connect, disconnect, error } = useWallet();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const shortAddress = address
    ? `${address.slice(0, 4)}…${address.slice(-4)}`
    : null;

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleDisconnect() {
    setDropdownOpen(false);
    disconnect();
  }

  return (
    <div ref={dropdownRef} style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
      <button
        id="connect-wallet-btn"
        onClick={isConnected ? () => setDropdownOpen(o => !o) : connect}
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
            <svg
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                marginLeft: '2px',
                transition: 'transform 0.15s ease',
                transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              }}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
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

      {/* Dropdown */}
      {isConnected && dropdownOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-default)',
            borderRadius: '12px',
            padding: '0.5rem',
            minWidth: '180px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
            zIndex: 100,
          }}
        >
          {/* Full address */}
          <div
            style={{
              padding: '0.5rem 0.75rem',
              fontSize: '0.6875rem',
              color: 'var(--text-tertiary)',
              fontFamily: 'JetBrains Mono, monospace',
              wordBreak: 'break-all',
              borderBottom: '1px solid var(--border-subtle)',
              marginBottom: '0.375rem',
            }}
          >
            {address}
          </div>

          {/* Disconnect button */}
          <button
            onClick={handleDisconnect}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 0.75rem',
              borderRadius: '8px',
              border: 'none',
              background: 'transparent',
              color: '#ef4444',
              fontSize: '0.8125rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'background 0.15s ease',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.1)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Disconnect
          </button>
        </div>
      )}

      {error && (
        <p style={{ fontSize: '0.6875rem', color: 'var(--red)', maxWidth: '200px', textAlign: 'right' }}>
          {error}
        </p>
      )}
    </div>
  );
}
