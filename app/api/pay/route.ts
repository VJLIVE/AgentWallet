/**
 * POST /api/pay
 *
 * Implements the real x402 payment flow on Algorand:
 *
 * 1. Client calls this endpoint with { agentId, resource, paymentPayload? }
 * 2. If no paymentPayload → return 402 with PAYMENT-REQUIRED header
 * 3. If paymentPayload present → verify with GoPlausible facilitator
 * 4. If valid → settle with facilitator → record in Supabase → return 200
 *
 * The paymentPayload is a base64-encoded ExactAvmPayloadV2 created by the
 * client using @x402/avm ExactAvmScheme + Pera Wallet signing.
 */
import { createClient } from '@/app/_lib/supabase/server';
import {
  buildPaymentRequirement,
  buildPaymentRequiredHeader,
  verifyPaymentWithFacilitator,
  settlePaymentWithFacilitator,
  getUsdcAsaId,
  getNetwork,
} from '@/app/_lib/algorand';

export async function POST(request: Request) {
  const body = await request.json() as {
    agentId?: string;
    resource?: string;
    paymentPayload?: string;  // base64-encoded ExactAvmPayloadV2
    senderAddress?: string;   // Algorand address of the payer
    negotiatedPrice?: number; // Optional: price agreed during negotiation
  };

  const { agentId, resource, paymentPayload, senderAddress, negotiatedPrice } = body;

  if (!agentId || !resource) {
    return Response.json(
      { error: 'Missing required fields: agentId, resource' },
      { status: 400 }
    );
  }

  // Fetch agent from Supabase
  const supabase = await createClient();
  const { data: agent, error: agentError } = await supabase
    .from('agents')
    .select('id, name, base_price, owner_wallet')
    .eq('id', agentId)
    .single();

  if (agentError || !agent) {
    return Response.json({ error: 'Agent not found' }, { status: 404 });
  }

  // Guard: AVM_ADDRESS must be set for payment to work
  if (!process.env.AVM_ADDRESS) {
    return Response.json(
      { error: 'Server misconfigured: AVM_ADDRESS environment variable is not set' },
      { status: 503 }
    );
  }

  const price = negotiatedPrice != null && negotiatedPrice > 0
    ? negotiatedPrice
    : parseFloat(agent.base_price);
  const requirement = buildPaymentRequirement(resource, price, `Payment for ${agent.name}`);

  // ── Step 1: No payment payload → return 402 ──────────────────────────────
  if (!paymentPayload) {
    const paymentRequiredHeader = buildPaymentRequiredHeader([requirement]);

    return new Response(
      JSON.stringify({
        error: 'Payment Required',
        x402Version: 2,
        accepts: [requirement],
      }),
      {
        status: 402,
        headers: {
          'Content-Type': 'application/json',
          'PAYMENT-REQUIRED': paymentRequiredHeader,
        },
      }
    );
  }

  // ── Step 2: Verify payment with facilitator ───────────────────────────────
  const verification = await verifyPaymentWithFacilitator(paymentPayload, requirement);

  if (!verification.valid) {
    return Response.json(
      {
        error: 'Payment verification failed',
        reason: verification.reason,
        x402Version: 2,
        accepts: [requirement],
      },
      {
        status: 402,
        headers: {
          'PAYMENT-REQUIRED': buildPaymentRequiredHeader([requirement]),
        },
      }
    );
  }

  // ── Step 3: Settle payment with facilitator ───────────────────────────────
  const settlement = await settlePaymentWithFacilitator(paymentPayload, requirement);

  if (!settlement.success) {
    return Response.json(
      { error: 'Payment settlement failed', reason: settlement.error },
      { status: 500 }
    );
  }

  // ── Step 4: Record transaction in Supabase ────────────────────────────────
  const { error: txError } = await supabase.from('transactions').insert({
    tx_hash: settlement.txHash,
    sender: senderAddress ?? 'unknown',
    receiver: agent.owner_wallet,
    amount: price,
    asa_id: getUsdcAsaId(),
    resource,
    x402_version: 2,
    network: getNetwork(),
    confirmed: true,
  });

  if (txError) {
    console.error('Failed to record transaction:', txError.message);
    // Don't fail the request — payment was settled on-chain
  }

  return Response.json({
    txHash: settlement.txHash,
    confirmed: true,
    amount: price,
    asset: getUsdcAsaId(),
    network: getNetwork(),
    receiver: agent.owner_wallet,
    resource,
  });
}
