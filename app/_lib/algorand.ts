/**
 * Algorand / x402 server-side utilities.
 *
 * Uses @x402/avm (ExactAvmScheme server) to build real PaymentRequirements
 * and @algorandfoundation/algokit-utils for network connectivity.
 *
 * The server wallet (AVM_ADDRESS) is the payTo address for all agent payments.
 * In production each agent would have its own wallet; for the hackathon demo
 * the platform wallet receives payments and distributes off-chain.
 */

import {
  ALGORAND_TESTNET_CAIP2,
  ALGORAND_MAINNET_CAIP2,
  USDC_TESTNET_ASA_ID,
  USDC_MAINNET_ASA_ID,
  USDC_DECIMALS,
} from '@x402/avm';
import type { X402PaymentRequirement } from './types';

// ─── Network helpers ──────────────────────────────────────────────────────────

export function getNetwork(): string {
  const net = process.env.NEXT_PUBLIC_ALGORAND_NETWORK ?? 'testnet';
  return net === 'mainnet' ? ALGORAND_MAINNET_CAIP2 : ALGORAND_TESTNET_CAIP2;
}

export function getUsdcAsaId(): string {
  const net = process.env.NEXT_PUBLIC_ALGORAND_NETWORK ?? 'testnet';
  return net === 'mainnet' ? USDC_MAINNET_ASA_ID : USDC_TESTNET_ASA_ID;
}

export function getAlgorandExplorerUrl(txId: string): string {
  const net = process.env.NEXT_PUBLIC_ALGORAND_NETWORK ?? 'testnet';
  const base = net === 'mainnet'
    ? 'https://allo.info/tx'
    : 'https://testnet.explorer.perawallet.app/tx';
  return `${base}/${txId}`;
}

// ─── Payment requirement builder ─────────────────────────────────────────────

/**
 * Builds an x402 PaymentRequirements object for a given resource and price.
 * The server uses ExactAvmScheme (server side) to produce the requirement.
 *
 * @param resource  - The API resource path being gated (e.g. "/api/execute")
 * @param usdcAmount - Price in USDC (e.g. 0.02 = 2 cents)
 * @param description - Human-readable description of the resource
 */
export function buildPaymentRequirement(
  resource: string,
  usdcAmount: number,
  description: string
): X402PaymentRequirement {
  const payTo = process.env.AVM_ADDRESS;
  if (!payTo) {
    throw new Error('AVM_ADDRESS environment variable is not set');
  }

  const network = getNetwork();
  const asaId = getUsdcAsaId();

  // Convert USDC decimal to micro-units (6 decimals)
  const amountInMicroUnits = Math.round(usdcAmount * Math.pow(10, USDC_DECIMALS));

  return {
    scheme: 'exact',
    network,
    payTo,
    amount: amountInMicroUnits.toString(),
    asset: asaId,
    resource,
    description,
  };
}

/**
 * Builds the PAYMENT-REQUIRED header value (base64-encoded JSON array).
 * This is what a 402 response sends back to the client.
 */
export function buildPaymentRequiredHeader(
  requirements: X402PaymentRequirement[]
): string {
  return Buffer.from(JSON.stringify(requirements)).toString('base64');
}

/**
 * Verifies a payment payload with the GoPlausible facilitator.
 * Returns { valid: boolean, reason?: string }
 */
export async function verifyPaymentWithFacilitator(
  paymentPayload: string,
  requirements: X402PaymentRequirement
): Promise<{ valid: boolean; reason?: string }> {
  const facilitatorUrl = process.env.X402_FACILITATOR_URL ?? 'https://facilitator.goplausible.xyz';

  try {
    const res = await fetch(`${facilitatorUrl}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        paymentPayload,
        paymentRequirements: requirements,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      return { valid: false, reason: `Facilitator error ${res.status}: ${text}` };
    }

    const data = await res.json() as { isValid: boolean; invalidReason?: string; invalidMessage?: string };
    return {
      valid: data.isValid,
      reason: data.invalidMessage ?? data.invalidReason,
    };
  } catch (err) {
    return { valid: false, reason: `Network error: ${String(err)}` };
  }
}

/**
 * Settles a payment via the GoPlausible facilitator.
 * Returns the Algorand transaction ID on success.
 */
export async function settlePaymentWithFacilitator(
  paymentPayload: string,
  requirements: X402PaymentRequirement
): Promise<{ txHash: string; success: boolean; error?: string }> {
  const facilitatorUrl = process.env.X402_FACILITATOR_URL ?? 'https://facilitator.goplausible.xyz';

  try {
    const res = await fetch(`${facilitatorUrl}/settle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        paymentPayload,
        paymentRequirements: requirements,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      return { txHash: '', success: false, error: `Facilitator error ${res.status}: ${text}` };
    }

    const data = await res.json() as { txnId?: string; txHash?: string; error?: string };
    const txHash = data.txnId ?? data.txHash ?? '';
    return { txHash, success: !!txHash };
  } catch (err) {
    return { txHash: '', success: false, error: String(err) };
  }
}
