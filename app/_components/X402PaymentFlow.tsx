'use client';

/**
 * X402PaymentFlow — triggers server-side autonomous payment.
 *
 * The server (AVM_PRIVATE_KEY) signs and settles the USDC payment on Algorand.
 * No client-side wallet signing is required — the platform wallet pays autonomously.
 *
 * Flow:
 * 1. POST /api/pay { agentId, resource, negotiatedPrice, senderAddress }
 * 2. Server builds + signs ExactAvmPayloadV2 using AVM_PRIVATE_KEY
 * 3. Server verifies + settles via GoPlausible facilitator
 * 4. Returns txHash
 */

import { useState, useCallback } from 'react';
import { useWallet } from './WalletProvider';
import type { PaymentResult } from '@/app/_lib/types';

export type PaymentStatus = 'idle' | 'requesting' | 'settling' | 'confirmed' | 'error';

interface Props {
  agentId: string;
  resource: string;
  negotiatedPrice?: number;
  onSuccess: (result: PaymentResult) => void;
  onError?: (err: string) => void;
  children?: (trigger: () => void, status: PaymentStatus) => React.ReactNode;
}

export function X402PaymentFlow({ agentId, resource, negotiatedPrice, onSuccess, onError, children }: Props) {
  const { address } = useWallet();
  const [status, setStatus] = useState<PaymentStatus>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [txHash, setTxHash] = useState<string | null>(null);

  const executePayment = useCallback(async () => {
    setStatus('requesting');
    setStatusMessage('Initiating autonomous payment...');

    try {
      setStatus('settling');
      setStatusMessage('Signing and settling on Algorand...');

      const res = await fetch('/api/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId,
          resource,
          senderAddress: address ?? undefined,
          ...(negotiatedPrice != null ? { negotiatedPrice } : {}),
        }),
      });

      if (!res.ok) {
        const err = await res.json() as { error: string; reason?: string };
        throw new Error(err.error ?? 'Payment failed');
      }

      const result = await res.json() as PaymentResult;

      setStatus('confirmed');
      setTxHash(result.txHash);
      setStatusMessage(`Confirmed! Tx: ${result.txHash.slice(0, 12)}...`);
      onSuccess(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setStatus('error');
      setStatusMessage(message);
      onError?.(message);
    }
  }, [agentId, resource, negotiatedPrice, address, onSuccess, onError]);

  if (children) {
    return <>{children(executePayment, status)}</>;
  }

  return (
    <div className="flex flex-col gap-3">
      <PaymentStatusDisplay status={status} message={statusMessage} txHash={txHash} />
      {(status === 'idle' || status === 'error') && (
        <button
          onClick={executePayment}
          className="px-4 py-2 rounded-lg text-sm font-medium"
          style={{ background: 'var(--accent)', color: '#fff' }}
        >
          ⚡ Pay Autonomously
        </button>
      )}
    </div>
  );
}

export function PaymentStatusDisplay({
  status,
  message,
  txHash,
}: {
  status: PaymentStatus;
  message: string;
  txHash: string | null;
}) {
  const network = process.env.NEXT_PUBLIC_ALGORAND_NETWORK ?? 'testnet';
  const explorerBase = network === 'mainnet'
    ? 'https://allo.info/tx'
    : 'https://testnet.explorer.perawallet.app/tx';

  const statusConfig: Record<PaymentStatus, { icon: string; color: string; label: string }> = {
    idle:       { icon: '💳', color: 'var(--text-muted)',      label: 'Ready to pay' },
    requesting: { icon: '⏳', color: 'var(--amber)',           label: 'Preparing payment' },
    settling:   { icon: '⛓️', color: 'var(--accent)',          label: 'Settling on Algorand' },
    confirmed:  { icon: '✅', color: 'var(--accent)',          label: 'Payment Confirmed' },
    error:      { icon: '❌', color: 'var(--red)',             label: 'Payment Failed' },
  };

  const cfg = statusConfig[status];

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.875rem', color: cfg.color }}>
      <span style={{ fontSize: '1rem', lineHeight: '1.25' }}>{cfg.icon}</span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.125rem' }}>
        <span style={{ fontWeight: '500' }}>{cfg.label}</span>
        {message && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{message}</span>}
        {txHash && status === 'confirmed' && (
          <a
            href={`${explorerBase}/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: '0.75rem', color: 'var(--accent)', textDecoration: 'underline' }}
          >
            View on Algorand Explorer →
          </a>
        )}
      </div>
    </div>
  );
}

