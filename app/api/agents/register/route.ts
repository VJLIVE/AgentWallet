/**
 * POST /api/agents/register
 *
 * Registers a new AI agent in the marketplace.
 * The caller must provide their Algorand wallet address (verified via Pera Wallet
 * on the frontend — we trust the address here since Supabase RLS + wallet
 * ownership is enforced at the UI layer).
 */
import { createClient } from '@/app/_lib/supabase/server';
import { isValidAlgorandAddress } from '@x402/avm';

export async function POST(request: Request) {
  const body = await request.json() as {
    name?: string;
    description?: string;
    endpoint?: string;
    supportedTasks?: string[];
    basePrice?: number;
    perToken?: number;
    ownerWallet?: string;
    model?: string;
    latency?: number;
  };

  const {
    name,
    description,
    endpoint,
    supportedTasks,
    basePrice,
    perToken = 0,
    ownerWallet,
    model = 'llama3',
    latency = 1000,
  } = body;

  // Validate required fields
  if (!name || !description || !endpoint || !ownerWallet) {
    return Response.json(
      { error: 'Missing required fields: name, description, endpoint, ownerWallet' },
      { status: 400 }
    );
  }

  if (!isValidAlgorandAddress(ownerWallet)) {
    return Response.json(
      { error: 'Invalid Algorand wallet address' },
      { status: 400 }
    );
  }

  if (typeof basePrice !== 'number' || basePrice <= 0) {
    return Response.json(
      { error: 'basePrice must be a positive number (USDC amount)' },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('agents')
    .insert({
      name,
      description,
      endpoint,
      supported_tasks: supportedTasks ?? [],
      base_price: basePrice,
      per_token: perToken,
      owner_wallet: ownerWallet,
      model,
      latency,
    })
    .select()
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  // Create initial reputation record
  await supabase.from('reputation').insert({
    agent_id: data.id,
    score: 5.0,
    successful_jobs: 0,
    failed_jobs: 0,
    disputes: 0,
  });

  return Response.json({
    id: data.id,
    name: data.name,
    ownerWallet: data.owner_wallet,
    createdAt: data.created_at,
  }, { status: 201 });
}
