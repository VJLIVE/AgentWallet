/**
 * POST /api/pay
 *
 * Implements the x402 payment flow on Algorand — fully server-side signing.
 *
 * The server wallet (AVM_PRIVATE_KEY) signs and submits the payment autonomously.
 * No client-side Pera Wallet interaction is needed for the payment itself.
 *
 * Flow:
 * 1. Client calls with { agentId, resource }
 * 2. Server builds PaymentRequirement
 * 3. Server signs the USDC transfer using AVM_PRIVATE_KEY via toClientAvmSigner
 * 4. Server verifies + settles with GoPlausible facilitator
 * 5. Records in Supabase → returns txHash
 */
import { createClient } from '@/app/_lib/supabase/server';
import {
  buildPaymentRequirement,
  verifyPaymentWithFacilitator,
  settlePaymentWithFacilitator,
  getUsdcAsaId,
  getNetwork,
} from '@/app/_lib/algorand';
import { ExactAvmScheme, toClientAvmSigner } from '@x402/avm';

export async function POST(request: Request) {
  const body = await request.json() as {
    agentId?: string;
    resource?: string;
    senderAddress?: string;
    negotiatedPrice?: number;
  };

  const { agentId, resource, senderAddress, negotiatedPrice } = body;

  if (!agentId || !resource) {
    return Response.json(
      { error: 'Missing required fields: agentId, resource' },
      { status: 400 }
    );
  }

  // Guard: AVM_PRIVATE_KEY and AVM_ADDRESS must be set
  if (!process.env.AVM_PRIVATE_KEY || !process.env.AVM_ADDRESS) {
    return Response.json(
      { error: 'Server misconfigured: AVM_PRIVATE_KEY / AVM_ADDRESS not set' },
      { status: 503 }
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

  const price = negotiatedPrice != null && negotiatedPrice > 0
    ? negotiatedPrice
    : parseFloat(agent.base_price);

  const requirement = buildPaymentRequirement(resource, price, `Payment for ${agent.name}`);

  try {
    // ── Build + sign payment payload server-side ──────────────────────────
    const signer = toClientAvmSigner(process.env.AVM_PRIVATE_KEY);
    const avmScheme = new ExactAvmScheme(signer);

    const paymentRequirements = {
      scheme: requirement.scheme,
      network: requirement.network as `${string}:${string}`,
      payTo: requirement.payTo,
      amount: requirement.amount,
      asset: requirement.asset,
      resource: requirement.resource,
      description: requirement.description,
      extra: requirement.extra ?? {},
      maxTimeoutSeconds: 60,
    };

    const payloadResult = await avmScheme.createPaymentPayload(2, paymentRequirements);

    // ── Verify with facilitator ───────────────────────────────────────────
    const verification = await verifyPaymentWithFacilitator(payloadResult, requirement);
    if (!verification.valid) {
      return Response.json(
        {
          error: 'Payment verification failed',
          reason: verification.reason,
        },
        { status: 402 }
      );
    }

    // ── Settle with facilitator ───────────────────────────────────────────
    const settlement = await settlePaymentWithFacilitator(payloadResult, requirement);
    if (!settlement.success) {
      return Response.json(
        { error: 'Payment settlement failed', reason: settlement.error },
        { status: 500 }
      );
    }

    // ── Record transaction in Supabase ────────────────────────────────────
    const { error: txError } = await supabase.from('transactions').insert({
      tx_hash: settlement.txHash,
      sender: senderAddress ?? process.env.AVM_ADDRESS,
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

  } catch (err) {
    console.error('Payment error:', err);
    return Response.json(
      { error: `Payment failed: ${String(err)}` },
      { status: 500 }
    );
  }
}
