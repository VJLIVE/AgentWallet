'use client';

import { useEffect, useState } from 'react';
import { useWallet } from '@/app/_components/WalletProvider';
import {
  getCreditBalance,
  hasOptedIn,
  optInToContract,
  buyCredits,
  getConversionRate,
  formatCredits,
  getTotalCreditsIssued,
} from '@/app/_lib/credits';
import { FadeIn } from '@/app/_components/FadeIn';

const PRESET_AMOUNTS = [
  { algo: 1, label: '1 ALGO', popular: false },
  { algo: 5, label: '5 ALGO', popular: true },
  { algo: 10, label: '10 ALGO', popular: false },
  { algo: 25, label: '25 ALGO', popular: false },
  { algo: 50, label: '50 ALGO', popular: false },
  { algo: 100, label: '100 ALGO', popular: false },
];

export default function CreditsPage() {
  const { address, isConnected, connect, signTransactions } = useWallet();
  const [credits, setCredits] = useState<number>(0);
  const [isOptedIn, setIsOptedIn] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
  const [conversionRate, setConversionRate] = useState<number>(100);
  const [totalIssued, setTotalIssued] = useState<number>(0);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  useEffect(() => {
    if (address) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address]);

  async function loadData() {
    if (!address) return;
    try {
      const [balance, opted, rate, total] = await Promise.all([
        getCreditBalance(address),
        hasOptedIn(address),
        getConversionRate(),
        getTotalCreditsIssued(),
      ]);
      setCredits(balance);
      setIsOptedIn(opted);
      setConversionRate(rate);
      setTotalIssued(total);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }

  async function handleOptIn() {
    if (!address || !signTransactions) return;
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await optInToContract(address, signTransactions);
      setIsOptedIn(true);
      setSuccess('Successfully enabled credit system!');
      await loadData();
    } catch (error) {
      console.error('Opt-in error:', error);
      setError(`Failed to opt-in: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleBuyCredits(algoAmount: number) {
    if (!address || !signTransactions) return;
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const result = await buyCredits(address, algoAmount, signTransactions);
      setSuccess(
        `Success! Added ${result.creditsAdded.toLocaleString()} credits. Transaction: ${result.txId.substring(0, 8)}...`
      );
      setCustomAmount('');
      setSelectedPreset(null);
      await loadData();
      // Notify navbar to refresh balance
      window.dispatchEvent(new CustomEvent('credits-updated'));
    } catch (error) {
      console.error('Buy credits error:', error);
      setError(`Failed to buy credits: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }

  const { usdcEquivalent } = formatCredits(credits);
  const selectedAmount = selectedPreset || parseFloat(customAmount) || 0;
  const estimatedCredits = selectedAmount * conversionRate;

  if (!isConnected) {
    return (
      <div
        style={{
          maxWidth: '1000px',
          width: '100%',
          margin: '0 auto',
          padding: '2.5rem 1.5rem 4rem',
        }}
      >
        <FadeIn>
          <div
            className="card"
            style={{
              padding: '3rem',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1.25rem',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'var(--accent-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--accent)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
              </svg>
            </div>
            <div>
              <p
                style={{
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: 'var(--text-primary)',
                  marginBottom: '0.375rem',
                }}
              >
                Wallet required to manage credits
              </p>
              <p
                style={{
                  fontSize: '0.875rem',
                  color: 'var(--text-tertiary)',
                  maxWidth: '360px',
                }}
              >
                Connect your Pera Wallet to buy and manage credits on Algorand Testnet.
              </p>
            </div>
            <button
              onClick={connect}
              className="btn-accent"
              style={{ borderRadius: '9999px' }}
            >
              Connect Pera Wallet
            </button>
          </div>
        </FadeIn>
      </div>
    );
  }

  return (
    <div
      style={{
        maxWidth: '1000px',
        width: '100%',
        margin: '0 auto',
        padding: '2.5rem 1.5rem 4rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '2rem',
      }}
    >
      {/* Page header */}
      <FadeIn>
        <div style={{ paddingBottom: '1.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
          <div className="section-label" style={{ marginBottom: '0.375rem' }}>
            Credit Management
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
            Purchase Credits
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)', marginTop: '0.5rem' }}>
            Buy credits with ALGO to power your AI agent workflows. Credits are stored securely on-chain and can be used across all agent services in the marketplace.
          </p>
        </div>
      </FadeIn>

      {/* Alerts */}
      {error && (
        <FadeIn>
          <div
            style={{
              padding: '0.875rem 1.25rem',
              borderRadius: '10px',
              border: '1px solid var(--red)',
              background: 'var(--red-subtle)',
              color: 'var(--red)',
              fontSize: '0.875rem',
            }}
          >
            {error}
          </div>
        </FadeIn>
      )}

      {success && (
        <FadeIn>
          <div
            style={{
              padding: '0.875rem 1.25rem',
              borderRadius: '10px',
              border: '1px solid var(--accent)',
              background: 'var(--accent-subtle)',
              color: 'var(--accent)',
              fontSize: '0.875rem',
            }}
          >
            {success}
          </div>
        </FadeIn>
      )}

      {/* Current Balance Card */}
      <FadeIn delay={0.1}>
        <div
          className="card"
          style={{
            padding: '2rem',
            background: 'linear-gradient(135deg, var(--accent-subtle) 0%, var(--bg-elevated) 100%)',
            border: '1px solid var(--accent-muted)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
            <div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)', marginBottom: '0.5rem' }}>
                Your Current Balance
              </div>
              <div style={{ fontSize: '2.5rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                {credits.toLocaleString()}
                <span style={{ fontSize: '1rem', fontWeight: '400', color: 'var(--text-secondary)', marginLeft: '0.75rem' }}>
                  credits
                </span>
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                ≈ ${usdcEquivalent} USDC value
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '0.25rem' }}>
                Conversion Rate
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                {conversionRate} credits
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                per 1 ALGO
              </div>
            </div>
          </div>
        </div>
      </FadeIn>

      {/* Opt-in Required */}
      {!isOptedIn && (
        <FadeIn delay={0.2}>
          <div
            className="card"
            style={{
              padding: '2rem',
              border: '1px solid var(--yellow-muted)',
              background: 'var(--yellow-subtle)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: 'var(--yellow)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                  One-time Setup Required
                </h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                  Before you can buy credits, you need to opt-in to the credit system smart contract. This is a one-time transaction that enables your wallet to hold credits.
                </p>
                <button
                  onClick={handleOptIn}
                  disabled={loading}
                  className="btn-primary"
                  style={{ borderRadius: '8px' }}
                >
                  {loading ? 'Processing...' : 'Enable Credit System'}
                </button>
              </div>
            </div>
          </div>
        </FadeIn>
      )}

      {/* Purchase Credits */}
      {isOptedIn && (
        <>
          <FadeIn delay={0.2}>
            <div className="card" style={{ padding: '2rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem' }}>
                Select Amount
              </h2>

              {/* Preset Amounts */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                {PRESET_AMOUNTS.map((preset) => (
                  <button
                    key={preset.algo}
                    onClick={() => {
                      setSelectedPreset(preset.algo);
                      setCustomAmount('');
                    }}
                    className={selectedPreset === preset.algo ? 'btn-accent' : 'btn-secondary'}
                    style={{
                      padding: '1.25rem',
                      borderRadius: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.5rem',
                      border: selectedPreset === preset.algo ? '2px solid var(--accent)' : '1px solid var(--border-default)',
                      position: 'relative',
                    }}
                  >
                    {preset.popular && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '-8px',
                          right: '-8px',
                          background: 'var(--accent)',
                          color: 'white',
                          fontSize: '0.625rem',
                          fontWeight: '700',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '6px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                        }}
                      >
                        Popular
                      </div>
                    )}
                    <div style={{ fontSize: '1.25rem', fontWeight: '700' }}>
                      {preset.label}
                    </div>
                    <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>
                      {(preset.algo * conversionRate).toLocaleString()} credits
                    </div>
                    <div style={{ fontSize: '0.7rem', opacity: 0.6 }}>
                      ≈ ${(preset.algo * conversionRate / 100).toFixed(2)}
                    </div>
                  </button>
                ))}
              </div>

              {/* Custom Amount */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.5rem', display: 'block' }}>
                  Or enter custom amount
                </label>
                <input
                  type="number"
                  value={customAmount}
                  onChange={(e) => {
                    setCustomAmount(e.target.value);
                    setSelectedPreset(null);
                  }}
                  min="0.1"
                  step="0.1"
                  className="input"
                  style={{ width: '100%' }}
                  placeholder="Enter ALGO amount (e.g., 2.5)"
                />
              </div>

              {/* Summary */}
              {selectedAmount > 0 && (
                <div
                  style={{
                    padding: '1.5rem',
                    background: 'var(--bg-elevated)',
                    borderRadius: '12px',
                    marginBottom: '1.5rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>You pay:</span>
                    <span style={{ fontSize: '0.875rem', fontWeight: '600' }}>{selectedAmount} ALGO</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>You receive:</span>
                    <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--accent)' }}>
                      {estimatedCredits.toLocaleString()} credits
                    </span>
                  </div>
                  <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem', marginTop: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Value:</span>
                      <span style={{ fontSize: '0.875rem', fontWeight: '600' }}>
                        ≈ ${(estimatedCredits / 100).toFixed(2)} USDC
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Buy Button */}
              <button
                onClick={() => handleBuyCredits(selectedAmount)}
                disabled={loading || selectedAmount <= 0}
                className="btn-accent"
                style={{ width: '100%', borderRadius: '12px', padding: '1rem', fontSize: '1rem', fontWeight: '600' }}
              >
                {loading ? 'Processing Transaction...' : `Buy ${estimatedCredits.toLocaleString()} Credits`}
              </button>
            </div>
          </FadeIn>

          {/* Info Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            <FadeIn delay={0.3}>
              <div className="card" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: 'var(--accent-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                  </div>
                  <h3 style={{ fontSize: '0.875rem', fontWeight: '600' }}>Secure & Transparent</h3>
                </div>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)', lineHeight: '1.5' }}>
                  Credits are stored on the Algorand blockchain, providing immutable records and transparent transactions.
                </p>
              </div>
            </FadeIn>

            <FadeIn delay={0.4}>
              <div className="card" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: 'var(--accent-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                  </div>
                  <h3 style={{ fontSize: '0.875rem', fontWeight: '600' }}>Instant Confirmation</h3>
                </div>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)', lineHeight: '1.5' }}>
                  Transactions are confirmed in seconds on Algorand&apos;s fast blockchain network.
                </p>
              </div>
            </FadeIn>

            <FadeIn delay={0.5}>
              <div className="card" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: 'var(--accent-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2">
                      <line x1="12" y1="1" x2="12" y2="23" />
                      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                    </svg>
                  </div>
                  <h3 style={{ fontSize: '0.875rem', fontWeight: '600' }}>Total Credits Issued</h3>
                </div>
                <p style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--accent)' }}>
                  {totalIssued.toLocaleString()}
                </p>
              </div>
            </FadeIn>
          </div>

          {/* Pricing Guide */}
          <FadeIn delay={0.6}>
            <div className="card" style={{ padding: '2rem', marginTop: '2rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                Pricing Guide
              </h2>
              
              <div style={{ display: 'grid', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'var(--bg-elevated)', borderRadius: '8px' }}>
                  <div>
                    <div style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>Simple Workflow</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>1 agent, 3 steps</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--accent)' }}>30 credits</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>≈ $0.30</div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'var(--bg-elevated)', borderRadius: '8px' }}>
                  <div>
                    <div style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>Medium Workflow</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>3 agents, 5 steps</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--accent)' }}>150 credits</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>≈ $1.50</div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'var(--bg-elevated)', borderRadius: '8px' }}>
                  <div>
                    <div style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>Complex Workflow</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>5 agents, 10 steps</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--accent)' }}>500 credits</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>≈ $5.00</div>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'var(--accent-subtle)', borderRadius: '8px', border: '1px solid var(--accent-muted)' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" style={{ flexShrink: 0, marginTop: '2px' }}>
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                  <div>
                    <div style={{ fontSize: '0.8125rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                      Credit Value
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                      100 credits = $1 USD (1 USDC). Credits are deducted when you execute workflows. Unused credits remain in your balance.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>

          {/* How to Use Credits */}
          <FadeIn delay={0.7}>
            <div className="card" style={{ padding: '2rem', marginTop: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2">
                  <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                </svg>
                How to Use Your Credits
              </h2>
              
              <div style={{ display: 'grid', gap: '1.25rem' }}>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div style={{ 
                    width: '32px', 
                    height: '32px', 
                    borderRadius: '50%', 
                    background: 'var(--accent-subtle)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    flexShrink: 0,
                    fontWeight: '700',
                    fontSize: '0.875rem',
                    color: 'var(--accent)'
                  }}>
                    1
                  </div>
                  <div>
                    <div style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                      Browse the Marketplace
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)', lineHeight: '1.5' }}>
                      Explore available AI agents and their capabilities in the marketplace.
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div style={{ 
                    width: '32px', 
                    height: '32px', 
                    borderRadius: '50%', 
                    background: 'var(--accent-subtle)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    flexShrink: 0,
                    fontWeight: '700',
                    fontSize: '0.875rem',
                    color: 'var(--accent)'
                  }}>
                    2
                  </div>
                  <div>
                    <div style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                      Create a Workflow
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)', lineHeight: '1.5' }}>
                      Use the workflow builder to compose multi-step AI agent tasks.
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div style={{ 
                    width: '32px', 
                    height: '32px', 
                    borderRadius: '50%', 
                    background: 'var(--accent-subtle)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    flexShrink: 0,
                    fontWeight: '700',
                    fontSize: '0.875rem',
                    color: 'var(--accent)'
                  }}>
                    3
                  </div>
                  <div>
                    <div style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                      Execute & Pay
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)', lineHeight: '1.5' }}>
                      Credits are automatically deducted when you run workflows. Agents receive USDC payments via x402.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>
        </>
      )}
    </div>
  );
}
