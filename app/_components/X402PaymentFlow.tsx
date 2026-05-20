'use client';

/**
 * X402PaymentFlow — handles the real x402 payment flow on Algorand.
 *
 * Flow:
 * 1. Call /api/pay without payload → get 402 + PAYMENT-REQUIRED header
 * 2. Parse PaymentRequirements from header
 * 3. Build ExactAvmPayloadV2 using @x402/avm ExactAvmScheme (client side)
 * 4. Sign with Pera Wallet via useWallet().signTransactions
 * 5. Retry /api/pay with paymentPayload → facilitator verifies + settles
 * 6. Return txHash to parent
 */

import { useState, useCallback } from 'react';
import { useWallet } from './WalletProvider';
import { ExactAvmScheme } from '@x402/avm';
import type { X402PaymentRequirement, PaymentResult } from '@/app/_lib/types';

export type PaymentStatus = 'idle' | 'requesting' | 'signing' | 'settling' | 'confirmed' | 'error';

interface Props {
  agentId: string;
  resource: string;
  negotiatedPrice?: number;  // If set, overrides the agent's base_price on the server
  onSuccess: (result: PaymentResult) => void;
  onError?: (err: string) => void;
  children?: (trigger: () => void, status: PaymentStatus) => React.ReactNode;
}

export function X402PaymentFlow({ agentId, resource, negotiatedPrice, onSuccess, onError, children }: Props) {
  const { address, isConnected, signTransactions } = useWallet();
  const [status, setStatus] = useState<PaymentStatus>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [txHash, setTxHash] = useState<string | null>(null);

  const executePayment = useCallback(async () => {
    if (!isConnected || !address) {
      onError?.('Connect your Pera Wallet first');
      return;
    }

    setStatus('requesting');
    setStatusMessage('Requesting payment requirements...');

    try {
      // ── Step 1: Get 402 response ──────────────────────────────────────────
      const initRes = await fetch('/api/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId,
          resource,
          ...(negotiatedPrice != null ? { negotiatedPrice } : {}),
        }),
      });

      if (initRes.status !== 402) {
        throw new Error(`Expected 402, got ${initRes.status}`);
      }

      const paymentRequiredHeader = initRes.headers.get('PAYMENT-REQUIRED');
      if (!paymentRequiredHeader) {
        throw new Error('Missing PAYMENT-REQUIRED header');
      }

      // Decode base64 → JSON array of PaymentRequirements
      const requirements: X402PaymentRequirement[] = JSON.parse(
        Buffer.from(paymentRequiredHeader, 'base64').toString('utf-8')
      );

      const req = requirements[0];
      if (!req) throw new Error('No payment requirements returned');

      const usdcAmount = (parseInt(req.amount) / 1e6).toFixed(6);
      setStatus('signing');
      setStatusMessage(`Sign payment of ${usdcAmount} USDC in Pera Wallet...`);

      // ── Step 2: Build payment payload using @x402/avm ────────────────────
      // Create a ClientAvmSigner that delegates signing to Pera Wallet
      const peraAvmSigner = {
        address,
        signTransactions: async (txns: Uint8Array[], indexes: number[]) => {
          return signTransactions(txns, indexes);
        },
      };

      const avmScheme = new ExactAvmScheme(peraAvmSigner);

      // Map our requirement to the x402/core PaymentRequirements shape
      const paymentRequirements = {
        scheme: req.scheme,
        network: req.network as `${string}:${string}`,
        payTo: req.payTo,
        amount: req.amount,
        asset: req.asset,
        resource: req.resource,
        description: req.description,
        extra: req.extra ?? {},
        maxTimeoutSeconds: 60,
      };

      const payloadResult = await avmScheme.createPaymentPayload(2, paymentRequirements);
      const paymentPayload = Buffer.from(JSON.stringify(payloadResult.payload)).toString('base64');

      setStatus('settling');
      setStatusMessage('Settling payment on Algorand via GoPlausible facilitator...');

      // ── Step 3: Submit payment payload ────────────────────────────────────
      const payRes = await fetch('/api/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId,
          resource,
          paymentPayload,
          senderAddress: address,
          ...(negotiatedPrice != null ? { negotiatedPrice } : {}),
        }),
      });

      if (!payRes.ok) {
        const err = await payRes.json() as { error: string };
        throw new Error(err.error ?? 'Payment failed');
      }

      const result = await payRes.json() as PaymentResult;

      setStatus('confirmed');
      setTxHash(result.txHash);
      setStatusMessage(`Confirmed on Algorand! Tx: ${result.txHash.slice(0, 12)}...`);
      onSuccess(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setStatus('error');
      setStatusMessage(message);
      onError?.(message);
    }
  }, [agentId, resource, negotiatedPrice, address, isConnected, signTransactions, onSuccess, onError]);

  if (children) {
    return <>{children(executePayment, status)}</>;
  }

  return (
    <div className="flex flex-col gap-3">
      <PaymentStatusDisplay status={status} message={statusMessage} txHash={txHash} />
      {(status === 'idle' || status === 'error') && (
        <button
          onClick={executePayment}
          disabled={!isConnected}
          className="px-4 py-2 bg-emerald-500 text-black rounded-lg text-sm font-medium hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isConnected ? '⚡ Pay with Pera Wallet' : 'Connect wallet to pay'}
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
    idle:      { icon: '💳', color: 'text-zinc-400',    label: 'Ready to pay' },
    requesting:{ icon: '⏳', color: 'text-yellow-400',  label: '402 Payment Required' },
    signing:   { icon: '✍️', color: 'text-blue-400',    label: 'Sign in Pera Wallet' },
    settling:  { icon: '⛓️', color: 'text-purple-400',  label: 'Settling on Algorand' },
    confirmed: { icon: '✅', color: 'text-emerald-400', label: 'Payment Confirmed' },
    error:     { icon: '❌', color: 'text-red-400',     label: 'Payment Failed' },
  };

  const cfg = statusConfig[status];

  return (
    <div className={`flex items-start gap-2 text-sm ${cfg.color}`}>
      <span className="text-base leading-5">{cfg.icon}</span>
      <div className="flex flex-col gap-0.5">
        <span className="font-medium">{cfg.label}</span>
        {message && <span className="text-xs text-zinc-500">{message}</span>}
        {txHash && status === 'confirmed' && (
          <a
            href={`${explorerBase}/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-emerald-400 underline hover:text-emerald-300"
          >
            View on Algorand Explorer →
          </a>
        )}
      </div>
    </div>
  );
}
