'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import type { WorkflowStep, NegotiationOffer, Agent, PaymentResult } from '@/app/_lib/types';
import WorkflowVisualizer from '@/app/_components/WorkflowVisualizer';
import NegotiationDialog from '@/app/_components/NegotiationDialog';
import { X402PaymentFlow, PaymentStatusDisplay } from '@/app/_components/X402PaymentFlow';
import { useWallet } from '@/app/_components/WalletProvider';

interface StepWithAgents extends WorkflowStep {
  discoveredAgents?: Agent[];
  reasoning?: string;
}

interface StepState {
  negotiation?: NegotiationOffer;
  paymentResult?: PaymentResult;
  paymentStatus: 'idle' | 'pending' | 'confirmed' | 'error';
  paymentPhase: 'idle' | 'requesting' | 'signing' | 'settling' | 'confirmed' | 'error';
  result?: string;
  phase: 'waiting' | 'negotiating' | 'paying' | 'executing' | 'done';
}

type FlowPhase = 'idle' | 'planning' | 'running' | 'complete';

const EXAMPLE_REQUESTS = [
  'Research and write a report on Algorand DeFi ecosystem',
  'Analyze AI IDE market trends and create a competitive analysis',
  'Summarize the latest developments in autonomous AI agents',
  'Research competitors and write a strategic analysis report',
];

export default function WorkflowPage() {
  return (
    <Suspense fallback={
      <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center gap-2 text-zinc-600 text-sm">
          <span className="animate-spin inline-block">⟳</span> Loading...
        </div>
      </div>
    }>
      <WorkflowPageInner />
    </Suspense>
  );
}

function WorkflowPageInner() {
  const { isConnected, address } = useWallet();
  const searchParams = useSearchParams();
  const [request, setRequest] = useState('');
  const [flowPhase, setFlowPhase] = useState<FlowPhase>('idle');
  const [steps, setSteps] = useState<StepWithAgents[]>([]);
  const [stepStates, setStepStates] = useState<StepState[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [finalResult, setFinalResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ollamaUsed, setOllamaUsed] = useState(false);
  // Pre-selected agent id from marketplace "Hire Agent" button
  const preselectedAgentId = searchParams.get('agent');

  // Refs to always have latest values in async callbacks (avoids stale closures)
  const stepsRef = useRef<StepWithAgents[]>([]);
  const stepStatesRef = useRef<StepState[]>([]);
  const stepResultsRef = useRef<Record<number, string>>({});

  // When arriving from marketplace with ?agent=<id>, show a hint
  useEffect(() => {
    if (preselectedAgentId) {
      setRequest(`Use agent ${preselectedAgentId} to complete my task`);
    }
  }, [preselectedAgentId]);

  function updateStepState(index: number, patch: Partial<StepState>) {
    setStepStates(prev => {
      const next = prev.map((s, i) => (i === index ? { ...s, ...patch } : s));
      stepStatesRef.current = next;
      return next;
    });
  }

  function updateStep(index: number, patch: Partial<StepWithAgents>) {
    setSteps(prev => {
      const next = prev.map((s, i) => (i === index ? { ...s, ...patch } : s));
      stepsRef.current = next;
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!request.trim()) return;

    setError(null);
    setFlowPhase('planning');
    setSteps([]);
    setStepStates([]);
    setFinalResult(null);
    setCurrentStepIndex(0);

    try {
      const res = await fetch('/api/workflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request }),
      });

      if (!res.ok) throw new Error(`Workflow API error: ${res.status}`);
      const data = await res.json() as {
        workflow: StepWithAgents[];
        ollamaUsed: boolean;
      };

      setSteps(data.workflow);
      stepsRef.current = data.workflow;
      setOllamaUsed(data.ollamaUsed);
      const initialStates = data.workflow.map(() => ({
        paymentStatus: 'idle' as const,
        paymentPhase: 'idle' as const,
        phase: 'waiting' as const,
      }));
      setStepStates(initialStates);
      stepStatesRef.current = initialStates;
      stepResultsRef.current = {};
      setFlowPhase('running');

      // Kick off first step
      setStepStates(prev => {
        const next = prev.map((s, i) => i === 0 ? { ...s, phase: 'negotiating' as const } : s);
        stepStatesRef.current = next;
        return next;
      });
    } catch (err) {
      setError(`Failed to plan workflow: ${err instanceof Error ? err.message : String(err)}`);
      setFlowPhase('idle');
    }
  }

  function handleNegotiationComplete(index: number, offer: NegotiationOffer) {
    updateStepState(index, { negotiation: offer, phase: 'paying' });
  }

  function handlePaymentSuccess(index: number, result: PaymentResult) {
    updateStepState(index, {
      paymentResult: result,
      paymentStatus: 'confirmed',
      paymentPhase: 'confirmed',
      phase: 'executing',
    });
    updateStep(index, { status: 'executing', txHash: result.txHash });
    executeStep(index, result.txHash);
  }

  function handlePaymentError(index: number, err: string) {
    updateStepState(index, { paymentStatus: 'error', paymentPhase: 'error' });
    setError(`Payment failed for step ${index + 1}: ${err}`);
  }

  async function executeStep(index: number, txHash: string) {
    const step = stepsRef.current[index];
    const agent = step?.discoveredAgents?.[0];
    if (!agent) {
      updateStep(index, { status: 'failed' });
      updateStepState(index, { phase: 'done' });
      advanceToNextStep(index, undefined);
      return;
    }

    // Collect results from previous steps as context (use ref for latest values)
    const context = Object.entries(stepResultsRef.current)
      .filter(([i]) => parseInt(i) < index)
      .map(([i, result]) => `Step ${parseInt(i) + 1} (${stepsRef.current[parseInt(i)]?.task}):\n${result}`)
      .join('\n\n');

    try {
      const res = await fetch('/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: agent.id,
          task: step.task,
          txHash,
          requesterWallet: address ?? 'unknown',
          context: context || undefined,
        }),
      });

      if (!res.ok) throw new Error(`Execute API error: ${res.status}`);
      const data = await res.json() as { result: string; status: string };

      stepResultsRef.current[index] = data.result;
      updateStep(index, {
        status: data.status === 'completed' ? 'completed' : 'failed',
        result: data.result,
      });
      updateStepState(index, { result: data.result, phase: 'done' });
      advanceToNextStep(index, data.result);
    } catch (err) {
      const errMsg = `Execution error: ${err instanceof Error ? err.message : String(err)}`;
      stepResultsRef.current[index] = errMsg;
      updateStep(index, { status: 'failed' });
      updateStepState(index, { result: errMsg, phase: 'done' });
      advanceToNextStep(index, errMsg);
    }
  }

  function advanceToNextStep(completedIndex: number, completedResult: string | undefined) {
    const currentSteps = stepsRef.current;
    const nextIndex = completedIndex + 1;
    if (nextIndex < currentSteps.length) {
      setCurrentStepIndex(nextIndex);
      setStepStates(prev => {
        const next = prev.map((s, i) => i === nextIndex ? { ...s, phase: 'negotiating' as const } : s);
        stepStatesRef.current = next;
        return next;
      });
    } else {
      setFlowPhase('complete');
      // Build final result from the ref (always up-to-date, no stale closure)
      const allResults = currentSteps
        .map((s, i) => `**${s.task}**\n${stepResultsRef.current[i] ?? '(no result)'}`)
        .join('\n\n---\n\n');
      setFinalResult(allResults);
    }
  }

  const visualizerSteps: WorkflowStep[] = steps.map(s => ({
    task: s.task,
    requiredAgent: s.discoveredAgents?.[0]?.name ?? s.requiredAgent,
    status: s.status ?? 'pending',
    agentId: s.discoveredAgents?.[0]?.id,
    agentName: s.discoveredAgents?.[0]?.name,
    result: s.result,
  }));

  return (
    <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-zinc-100">Workflow Builder</h1>
        <p className="text-zinc-500 mt-1 text-sm">
          Describe a task — agents plan, negotiate, pay via x402, and execute autonomously
        </p>
      </div>

      {/* Wallet warning */}
      {!isConnected && (
        <div className="px-4 py-3 rounded-lg border border-amber-700/40 bg-amber-950/20 text-amber-400 text-sm flex items-center gap-2">
          <span>⚠️</span>
          <span>Connect your Pera Wallet to make real x402 payments on Algorand Testnet.</span>
        </div>
      )}

      {/* Input form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex gap-3">
          <input
            type="text"
            value={request}
            onChange={e => setRequest(e.target.value)}
            placeholder="Describe your task..."
            disabled={flowPhase === 'planning' || flowPhase === 'running'}
            className="flex-1 px-4 py-3 rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-100 placeholder-zinc-500 text-sm focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 transition-colors disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!request.trim() || flowPhase === 'planning' || flowPhase === 'running'}
            className="px-5 py-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-950 font-semibold text-sm transition-colors"
          >
            {flowPhase === 'planning' ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin inline-block">⟳</span> Planning...
              </span>
            ) : 'Run →'}
          </button>
        </div>

        {flowPhase === 'idle' && (
          <div className="flex flex-wrap gap-2">
            {EXAMPLE_REQUESTS.map(ex => (
              <button
                key={ex}
                type="button"
                onClick={() => setRequest(ex)}
                className="text-xs px-3 py-1.5 rounded-full border border-zinc-700 bg-zinc-900 text-zinc-400 hover:text-zinc-200 hover:border-zinc-600 transition-colors"
              >
                {ex}
              </button>
            ))}
          </div>
        )}
      </form>

      {error && (
        <div className="px-4 py-3 rounded-lg border border-red-700/40 bg-red-950/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Ollama indicator */}
      {steps.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <span className={`w-1.5 h-1.5 rounded-full ${ollamaUsed ? 'bg-emerald-400' : 'bg-zinc-600'}`} />
          {ollamaUsed ? 'Planned by Ollama LLM' : 'Planned by keyword fallback (start Ollama for real AI planning)'}
        </div>
      )}

      {/* Workflow visualizer */}
      {steps.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide">Workflow Plan</h2>
          <WorkflowVisualizer steps={visualizerSteps} />
        </div>
      )}

      {/* Step-by-step execution */}
      {stepStates.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide">Execution</h2>

          {stepStates.map((ss, i) => {
            const step = steps[i];
            const agent = step?.discoveredAgents?.[0];
            const isActive = i === currentStepIndex && flowPhase === 'running';
            const isDone = ss.phase === 'done';
            const isFuture = i > currentStepIndex;

            return (
              <div
                key={i}
                className={`rounded-xl border p-5 space-y-4 transition-all duration-300 ${
                  isDone
                    ? 'border-emerald-800/40 bg-zinc-900'
                    : isActive
                    ? 'border-zinc-600 bg-zinc-900'
                    : 'border-zinc-800 bg-zinc-950 opacity-40'
                }`}
              >
                {/* Step header */}
                <div className="flex items-center gap-3">
                  <span className="text-lg">
                    {isDone ? '✅' : isActive ? '⚡' : isFuture ? '⏳' : '⏳'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-zinc-200 font-semibold">{step.task}</div>
                    {agent && (
                      <div className="text-zinc-500 text-xs mt-0.5">
                        {agent.name} · {agent.model} · ${agent.pricing.basePrice.toFixed(4)} USDC
                        {step.reasoning && (
                          <span className="ml-2 italic text-zinc-600">— {step.reasoning}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Negotiation phase */}
                {isActive && ss.phase === 'negotiating' && agent && (
                  <NegotiationDialog
                    agent={agent}
                    budget={agent.pricing.basePrice * 1.2}
                    onComplete={offer => handleNegotiationComplete(i, offer)}
                  />
                )}

                {/* Payment phase — real x402 flow */}
                {isActive && ss.phase === 'paying' && agent && (
                  <div className="space-y-3">
                    <div className="text-sm text-zinc-400 font-medium">
                      Agreed price: <span className="text-emerald-400 font-mono">
                        ${ss.negotiation?.finalPrice?.toFixed(4) ?? agent.pricing.basePrice.toFixed(4)} USDC
                      </span>
                    </div>

                    <X402PaymentFlow
                      agentId={agent.id}
                      resource={`/api/execute/${step.task.replace(/\s+/g, '-').toLowerCase()}`}
                      negotiatedPrice={ss.negotiation?.finalPrice}
                      onSuccess={result => handlePaymentSuccess(i, result)}
                      onError={err => handlePaymentError(i, err)}
                    >
                      {(trigger, payStatus) => (
                        <div className="space-y-3">
                          <PaymentStatusDisplay
                            status={payStatus}
                            message={
                              payStatus === 'idle'
                                ? 'Ready to pay'
                                : payStatus === 'requesting'
                                ? 'Sending 402 request...'
                                : payStatus === 'signing'
                                ? 'Sign in Pera Wallet app...'
                                : payStatus === 'settling'
                                ? 'Settling on Algorand...'
                                : payStatus === 'confirmed'
                                ? 'Payment confirmed on-chain'
                                : 'Payment failed'
                            }
                            txHash={ss.paymentResult?.txHash ?? null}
                          />
                          {(payStatus === 'idle' || payStatus === 'error') && (
                            <button
                              onClick={trigger}
                              disabled={!isConnected}
                              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-zinc-950 rounded-lg text-sm font-semibold transition-colors"
                            >
                              {isConnected ? '⚡ Pay with Pera Wallet' : 'Connect wallet to pay'}
                            </button>
                          )}
                        </div>
                      )}
                    </X402PaymentFlow>
                  </div>
                )}

                {/* Executing indicator */}
                {isActive && ss.phase === 'executing' && (
                  <div className="flex items-center gap-2 text-sm text-blue-400">
                    <span className="animate-spin inline-block">⟳</span>
                    Executing via Ollama ({agent?.model ?? 'llama3'})...
                  </div>
                )}

                {/* Result */}
                {ss.result && (
                  <div className="px-4 py-3 rounded-lg border border-zinc-800 bg-zinc-950 text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap max-h-64 overflow-y-auto">
                    {ss.result}
                  </div>
                )}

                {/* On-chain proof */}
                {ss.paymentResult?.txHash && isDone && (
                  <div className="text-xs text-zinc-600 font-mono">
                    Settled on-chain:{' '}
                    <a
                      href={`${
                        process.env.NEXT_PUBLIC_ALGORAND_NETWORK === 'mainnet'
                          ? 'https://allo.info/tx'
                          : 'https://testnet.explorer.perawallet.app/tx'
                      }/${ss.paymentResult.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-500 hover:text-emerald-400 underline"
                    >
                      {ss.paymentResult.txHash.slice(0, 16)}...
                    </a>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Final assembled result */}
      {flowPhase === 'complete' && finalResult && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/10 p-6 space-y-4">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold">
            <span>✅</span>
            <span>Workflow Complete — {steps.length} steps executed</span>
          </div>
          <div className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto">
            {finalResult}
          </div>
          <button
            onClick={() => {
              setFlowPhase('idle');
              setRequest('');
              setSteps([]);
              stepsRef.current = [];
              setStepStates([]);
              stepStatesRef.current = [];
              stepResultsRef.current = {};
              setFinalResult(null);
              setCurrentStepIndex(0);
              setError(null);
            }}
            className="text-sm px-4 py-2 rounded-lg border border-zinc-700 hover:border-zinc-500 text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            Run another workflow
          </button>
        </div>
      )}
    </div>
  );
}
