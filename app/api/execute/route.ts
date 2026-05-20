/**
 * POST /api/execute
 *
 * Executes a task using the specified agent via Ollama.
 * Requires a valid txHash proving payment was made.
 * Records the job in Supabase.
 */
import { createClient } from '@/app/_lib/supabase/server';
import { executeAgentTask } from '@/app/_lib/ollama';
import crypto from 'crypto';

export async function POST(request: Request) {
  const body = await request.json() as {
    agentId?: string;
    task?: string;
    txHash?: string;
    requesterWallet?: string;
    context?: string;
  };

  const { agentId, task, txHash, requesterWallet, context } = body;

  if (!agentId || !task || !txHash) {
    return Response.json(
      { error: 'Missing required fields: agentId, task, txHash' },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  // Verify the txHash exists in our transactions table
  const { data: txRecord } = await supabase
    .from('transactions')
    .select('id, confirmed, amount')
    .eq('tx_hash', txHash)
    .single();

  if (!txRecord || !txRecord.confirmed) {
    return Response.json(
      { error: 'Payment not found or not confirmed. Pay first via /api/pay.' },
      { status: 402 }
    );
  }

  // Guard against replaying the same payment for a second job
  const { data: existingJob } = await supabase
    .from('jobs')
    .select('id')
    .eq('tx_hash', txHash)
    .maybeSingle();

  if (existingJob) {
    return Response.json(
      { error: 'This payment has already been used for a job.' },
      { status: 409 }
    );
  }

  // Fetch agent details (include description for system prompt)
  const { data: agent, error: agentError } = await supabase
    .from('agents')
    .select('id, name, description, model, supported_tasks, total_jobs')
    .eq('id', agentId)
    .single();

  if (agentError || !agent) {
    return Response.json({ error: 'Agent not found' }, { status: 404 });
  }

  // Determine agent type from supported tasks
  const agentType = inferAgentType(agent.supported_tasks as string[]);

  // Create job record
  const { data: job, error: jobError } = await supabase
    .from('jobs')
    .insert({
      requester_wallet: requesterWallet ?? 'unknown',
      provider_agent_id: agentId,
      task,
      payment_amount: parseFloat(String(txRecord.amount ?? '0')),
      status: 'executing',
      tx_hash: txHash,
    })
    .select()
    .single();

  if (jobError) {
    console.error('Failed to create job record:', jobError.message);
  }

  // Execute task with Ollama — pass agent description as system prompt
  let result: string;
  let status: 'completed' | 'failed' = 'completed';

  try {
    result = await executeAgentTask(agentType, task, agent.model, context, agent.description);
  } catch (err) {
    result = `Execution failed: ${String(err)}`;
    status = 'failed';
  }

  // Compute result hash for on-chain proof
  const resultHash = crypto.createHash('sha256').update(result).digest('hex');
  const completedAt = new Date().toISOString();

  // Update job record
  if (job) {
    await supabase
      .from('jobs')
      .update({
        status,
        result,
        result_hash: resultHash,
        completed_at: completedAt,
      })
      .eq('id', job.id);
  }

  // Update agent reputation and job count
  if (status === 'completed') {
    const { error: rpcError } = await supabase.rpc('increment_agent_jobs', { agent_id: agentId });
    if (rpcError) {
      await supabase
        .from('agents')
        .update({ total_jobs: (agent.total_jobs ?? 0) + 1 })
        .eq('id', agentId);
    }

    // Deduct credits from requester: 1 USDC = 100 credits
    if (requesterWallet && requesterWallet !== 'unknown') {
      const usdcAmount = parseFloat(String(txRecord.amount ?? '0'));
      console.log(`[CREDIT DEDUCTION] Attempting to deduct ${usdcAmount} USDC (${Math.ceil(usdcAmount * 100)} credits) from ${requesterWallet}`);
      if (usdcAmount > 0) {
        try {
          const creditResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/api/credits`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'deduct',
              address: requesterWallet,
              usdcAmount,
            }),
          });
          const creditResult = await creditResponse.json();
          if (!creditResponse.ok) {
            console.error('[CREDIT DEDUCTION] Failed:', creditResult);
          } else {
            console.log('[CREDIT DEDUCTION] Success:', creditResult);
          }
        } catch (creditErr) {
          // Non-fatal — log but don't fail the job
          console.error('[CREDIT DEDUCTION] Exception:', creditErr);
        }
      } else {
        console.log('[CREDIT DEDUCTION] Skipped - amount is 0');
      }
    } else {
      console.log('[CREDIT DEDUCTION] Skipped - no valid requester wallet');
    }
  }

  return Response.json({
    jobId: job?.id,
    agentId,
    agentName: agent.name,
    task,
    result,
    resultHash,
    status,
    completedAt,
    creditsDeducted: status === 'completed'
      ? Math.ceil(parseFloat(String(txRecord.amount ?? '0')) * 100)
      : 0,
  });
}

function inferAgentType(supportedTasks: string[]): string {
  const tasks = supportedTasks.join(' ').toLowerCase();
  if (tasks.includes('research') || tasks.includes('analysis')) return 'research-agent';
  if (tasks.includes('write') || tasks.includes('report')) return 'writer-agent';
  if (tasks.includes('chart') || tasks.includes('visual')) return 'visualization-agent';
  if (tasks.includes('summar') || tasks.includes('pdf')) return 'summarizer-agent';
  if (tasks.includes('negotiat')) return 'negotiator-agent';
  return 'research-agent';
}
