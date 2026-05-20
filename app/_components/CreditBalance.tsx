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
} from '@/app/_lib/credits';

export default function CreditBalance() {
  const { address, isConnected, signTransactions } = useWallet();
  const [credits, setCredits] = useState<number>(0);
  const [isOptedIn, setIsOptedIn] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [buyAmount, setBuyAmount] = useState<string>('1');
  const [conversionRate, setConversionRate] = useState<number>(100);
  const [showBuyModal, setShowBuyModal] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Load credit balance
  useEffect(() => {
    if (address) {
      loadBalance();
      checkOptIn();
      loadConversionRate();
    }
  }, [address]);

  async function loadBalance() {
    if (!address) return;
    try {
      const balance = await getCreditBalance(address);
      setCredits(balance);
    } catch (error) {
      console.error('Error loading balance:', error);
    }
  }

  async function checkOptIn() {
    if (!address) return;
    try {
      const opted = await hasOptedIn(address);
      setIsOptedIn(opted);
    } catch (error) {
      console.error('Error checking opt-in:', error);
    }
  }

  async function loadConversionRate() {
    try {
      const rate = await getConversionRate();
      setConversionRate(rate);
    } catch (error) {
      console.error('Error loading rate:', error);
    }
  }

  async function handleOptIn() {
    if (!address || !signTransactions) return;
    setLoading(true);
    setError('');
    try {
      await optInToContract(address, signTransactions);
      setIsOptedIn(true);
      alert('Successfully opted into credit system!');
    } catch (error: any) {
      console.error('Opt-in error:', error);
      setError(`Failed to opt-in: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleBuyCredits() {
    if (!address || !signTransactions) return;
    const algoAmount = parseFloat(buyAmount);
    if (isNaN(algoAmount) || algoAmount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const result = await buyCredits(address, algoAmount, signTransactions);
      alert(
        `Success! Added ${result.creditsAdded} credits.\nTransaction: ${result.txId}`
      );
      await loadBalance();
      setShowBuyModal(false);
      setBuyAmount('1');
    } catch (error: any) {
      console.error('Buy credits error:', error);
      setError(`Failed to buy credits: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  if (!isConnected || !address) {
    return null;
  }

  const { usdcEquivalent } = formatCredits(credits);
  const estimatedCredits = parseFloat(buyAmount || '0') * conversionRate;

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      {/* Credit Balance Card */}
      <div
        className="card"
        style={{
          padding: '1.25rem',
          background: 'linear-gradient(135deg, var(--accent-subtle) 0%, var(--bg-elevated) 100%)',
          border: '1px solid var(--accent-muted)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '0.25rem' }}>
              Your Credits
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--text-primary)' }}>
              {credits.toLocaleString()}
              <span style={{ fontSize: '0.875rem', fontWeight: '400', color: 'var(--text-secondary)', marginLeft: '0.5rem' }}>
                ≈ ${usdcEquivalent} USDC
              </span>
            </div>
          </div>

          {isOptedIn ? (
            <button
              onClick={() => setShowBuyModal(true)}
              className="btn-accent"
              style={{ borderRadius: '8px', padding: '0.5rem 1rem' }}
            >
              + Buy Credits
            </button>
          ) : (
            <button
              onClick={handleOptIn}
              disabled={loading}
              className="btn-primary"
              style={{ borderRadius: '8px', padding: '0.5rem 1rem' }}
            >
              {loading ? 'Opting in...' : 'Enable Credits'}
            </button>
          )}
        </div>

        {!isOptedIn && (
          <div
            style={{
              marginTop: '0.75rem',
              padding: '0.75rem',
              background: 'var(--yellow-subtle)',
              border: '1px solid var(--yellow-muted)',
              borderRadius: '6px',
              fontSize: '0.8125rem',
              color: 'var(--text-secondary)',
            }}
          >
            ⚠️ You need to opt-in to the credit system before buying credits (one-time setup)
          </div>
        )}

        {error && (
          <div
            style={{
              marginTop: '0.75rem',
              padding: '0.75rem',
              background: 'var(--red-subtle)',
              border: '1px solid var(--red)',
              borderRadius: '6px',
              fontSize: '0.8125rem',
              color: 'var(--red)',
            }}
          >
            {error}
          </div>
        )}
      </div>

      {/* Buy Credits Modal */}
      {showBuyModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowBuyModal(false)}
        >
          <div
            className="card"
            style={{
              padding: '2rem',
              maxWidth: '400px',
              width: '90%',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Buy Credits</h3>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', display: 'block' }}>
                Amount (ALGO)
              </label>
              <input
                type="number"
                value={buyAmount}
                onChange={(e) => setBuyAmount(e.target.value)}
                min="0.1"
                step="0.1"
                className="input"
                style={{ width: '100%' }}
                placeholder="1.0"
              />
              <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.5rem' }}>
                Rate: {conversionRate} credits per ALGO
              </div>
            </div>

            <div
              style={{
                padding: '1rem',
                background: 'var(--bg-elevated)',
                borderRadius: '8px',
                marginBottom: '1.5rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>You pay:</span>
                <span style={{ fontSize: '0.875rem', fontWeight: '600' }}>{buyAmount} ALGO</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>You receive:</span>
                <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--accent)' }}>
                  {estimatedCredits.toLocaleString()} credits
                </span>
              </div>
            </div>

            {error && (
              <div
                style={{
                  marginBottom: '1rem',
                  padding: '0.75rem',
                  background: 'var(--red-subtle)',
                  border: '1px solid var(--red)',
                  borderRadius: '6px',
                  fontSize: '0.8125rem',
                  color: 'var(--red)',
                }}
              >
                {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => {
                  setShowBuyModal(false);
                  setError('');
                }}
                className="btn-secondary"
                style={{ flex: 1, borderRadius: '8px' }}
              >
                Cancel
              </button>
              <button
                onClick={handleBuyCredits}
                disabled={loading}
                className="btn-accent"
                style={{ flex: 1, borderRadius: '8px' }}
              >
                {loading ? 'Processing...' : 'Buy Credits'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
