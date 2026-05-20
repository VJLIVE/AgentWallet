'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import type { WorkflowStep, NegotiationOffer, Agent, PaymentResult } from '@/app/_lib/types';
import WorkflowVisualizer from '@/app/_components/WorkflowVisualizer';
import NegotiationDialog from '@/app/_components/NegotiationDialog';
import { useWallet } from '@/app/_components/WalletProvider';

interface StepWithAgents extends WorkflowStep {
  discoveredAgents?: Agent[];
  reasoning?: string;
}

interface StepState {
  negotiation?: NegotiationOffer;
  paymentResult?: PaymentResult;
  paymentStatus: 'idle' | 'pending' | 'confirmed' | 'error';
  paymentPhase: 'idle' | 'requesting' | 'settling' | 'confirmed' | 'error';
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

function PhaseIcon({ phase, isDone, isActive }: { phase: string; isDone: boolean; isActive: boolean }) {
  if (isDone) {
    return (
      <div style={{
        width: '36px', height: '36px', borderRadius: '50%',
        background: 'var(--accent-subtle)',
        border: '2px solid var(--accent)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20,6 9,17 4,12"/>
        </svg>
      </div>
    );
  }
  if (isActive) {
    return (
      <div style={{
        width: '36px', height: '36px', borderRadius: '50%',
        background: 'var(--bg-elevated)',
        border: '2px solid var(--border-strong)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <span className="spinner" style={{ width: '14px', height: '14px', borderWidth: '2px' }} />
      </div>
    );
  }
  return (
    <div style={{
      width: '36px', height: '36px', borderRadius: '50%',
      background: 'var(--bg-elevated)',
      border: '2px solid var(--border-subtle)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>
      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--border-strong)' }} />
    </div>
  );
}

export default function WorkflowPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '5rem 1rem', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
        <span className="spinner" />
        Loading…
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
  const preselectedAgentId = searchParams.get('agent');

  const stepsRef = useRef<StepWithAgents[]>([]);
  const stepStatesRef = useRef<StepState[]>([]);
  const stepResultsRef = useRef<Record<number, string>>({});

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
      const data = await res.json() as { workflow: StepWithAgents[]; ollamaUsed: boolean };

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
    // Trigger payment automatically — no button needed
    triggerPayment(index, offer);
  }

  async function triggerPayment(index: number, offer: NegotiationOffer) {
    const step = stepsRef.current[index];
    const agent = step?.discoveredAgents?.[0];
    if (!agent) {
      handlePaymentError(index, 'No agent found for this step');
      return;
    }

    updateStepState(index, {
      paymentPhase: 'settling',
    });

    try {
      const res = await fetch('/api/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: agent.id,
          resource: `/api/execute/${step.task.replace(/\s+/g, '-').toLowerCase()}`,
          senderAddress: address ?? undefined,
          negotiatedPrice: offer.finalPrice,
        }),
      });

      if (!res.ok) {
        const err = await res.json() as { error: string; reason?: string };
        throw new Error(err.error ?? 'Payment failed');
      }

      const result = await res.json() as PaymentResult;
      handlePaymentSuccess(index, result);
    } catch (err) {
      handlePaymentError(index, err instanceof Error ? err.message : String(err));
    }
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
      updateStep(index, { status: data.status === 'completed' ? 'completed' : 'failed', result: data.result });
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
      <div style={{ paddingBottom: '1.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="section-label" style={{ marginBottom: '0.375rem' }}>Workflow Builder</div>
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
          Autonomous Task Execution
        </h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)', marginTop: '0.5rem' }}>
          Describe a task — agents plan, negotiate, pay via x402, and execute autonomously
        </p>
      </div>

      {/* Wallet warning */}
      {!isConnected && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.875rem 1.25rem',
            borderRadius: '10px',
            border: '1px solid color-mix(in srgb, var(--amber) 30%, transparent)',
            background: 'var(--amber-subtle)',
            color: 'var(--amber)',
            fontSize: '0.875rem',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <span>Connect your Pera Wallet to make real x402 payments on Algorand Testnet.</span>
        </div>
      )}

      {/* Input form */}
      <div
        className="card"
        style={{ padding: '1.5rem' }}
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <label style={{ fontSize: '0.8125rem', fontWeight: '600', color: 'var(--text-secondary)' }}>
            Describe your objective
          </label>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <input
              id="workflow-input"
              type="text"
              value={request}
              onChange={e => setRequest(e.target.value)}
              placeholder="e.g. Research and write a report on Algorand DeFi ecosystem…"
              disabled={flowPhase === 'planning' || flowPhase === 'running'}
              className="input focus-ring"
              style={{ flex: 1 }}
            />
            <button
              id="workflow-submit-btn"
              type="submit"
              disabled={!request.trim() || flowPhase === 'planning' || flowPhase === 'running'}
              className="btn-primary"
              style={{ borderRadius: '8px', flexShrink: 0 }}
            >
              {flowPhase === 'planning' ? (
                <>
                  <span className="spinner" style={{ width: '12px', height: '12px', borderWidth: '1.5px' }} />
                  Planning…
                </>
              ) : 'Run →'}
            </button>
          </div>

          {flowPhase === 'idle' && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {EXAMPLE_REQUESTS.map(ex => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => setRequest(ex)}
                  style={{
                    padding: '0.25rem 0.75rem',
                    borderRadius: '9999px',
                    fontSize: '0.75rem',
                    border: '1px solid var(--border-default)',
                    background: 'transparent',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-elevated)';
                    (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                    (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)';
                  }}
                >
                  {ex}
                </button>
              ))}
            </div>
          )}
        </form>
      </div>

      {/* Error */}
      {error && (
        <div
          style={{
            padding: '0.875rem 1.25rem',
            borderRadius: '10px',
            border: '1px solid color-mix(in srgb, var(--red) 30%, transparent)',
            background: 'var(--red-subtle)',
            color: 'var(--red)',
            fontSize: '0.875rem',
          }}
        >
          {error}
        </div>
      )}

      {/* Ollama indicator */}
      {steps.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span
            style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              background: ollamaUsed ? 'var(--accent)' : 'var(--border-strong)',
              flexShrink: 0,
            }}
          />
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>
            {ollamaUsed
              ? 'Planned by Ollama LLM'
              : 'Planned by keyword fallback (start Ollama for real AI planning)'}
          </span>
        </div>
      )}

      {/* Workflow visualizer */}
      {steps.length > 0 && (
        <div>
          <div className="section-label" style={{ marginBottom: '1rem' }}>Workflow Plan</div>
          <WorkflowVisualizer steps={visualizerSteps} />
        </div>
      )}

      {/* Step-by-step execution */}
      {stepStates.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="section-label">Execution</div>

          {stepStates.map((ss, i) => {
            const step = steps[i];
            const agent = step?.discoveredAgents?.[0];
            const isActive = i === currentStepIndex && flowPhase === 'running';
            const isDone = ss.phase === 'done';
            const isFuture = i > currentStepIndex;

            return (
              <div
                key={i}
                className="card"
                style={{
                  padding: '1.375rem',
                  opacity: isFuture ? 0.45 : 1,
                  transition: 'all 0.3s ease',
                  borderColor: isDone
                    ? 'color-mix(in srgb, var(--accent) 25%, transparent)'
                    : isActive
                    ? 'var(--border-strong)'
                    : undefined,
                }}
              >
                {/* Step header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.875rem' }}>
                  <PhaseIcon phase={ss.phase} isDone={isDone} isActive={isActive} />

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: '0.9375rem',
                        fontWeight: '600',
                        color: 'var(--text-primary)',
                        lineHeight: '1.3',
                      }}
                    >
                      {step.task}
                    </div>
                    {agent && (
                      <div
                        style={{
                          fontSize: '0.8125rem',
                          color: 'var(--text-tertiary)',
                          marginTop: '0.25rem',
                          fontFamily: 'JetBrains Mono, monospace',
                        }}
                      >
                        {agent.name} · {agent.model} ·{' '}
                        <span style={{ color: 'var(--accent)' }}>
                          ${agent.pricing.basePrice.toFixed(4)} USDC
                        </span>
                        {step.reasoning && (
                          <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontFamily: 'inherit' }}>
                            {' '}— {step.reasoning}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <span
                    style={{
                      fontSize: '0.6875rem',
                      fontFamily: 'JetBrains Mono, monospace',
                      fontWeight: '600',
                      color: 'var(--text-muted)',
                      flexShrink: 0,
                    }}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </span>
                </div>

                {/* Negotiation */}
                {isActive && ss.phase === 'negotiating' && agent && (
                  <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-subtle)' }}>
                    <NegotiationDialog
                      agent={agent}
                      budget={agent.pricing.basePrice * 1.2}
                      onComplete={offer => handleNegotiationComplete(i, offer)}
                    />
                  </div>
                )}

                {/* Payment */}
                {isActive && ss.phase === 'paying' && agent && (
                  <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-subtle)' }}>
                    <div
                      style={{
                        fontSize: '0.8125rem',
                        color: 'var(--text-secondary)',
                        marginBottom: '0.875rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.375rem',
                      }}
                    >
                      Agreed price:
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: '600', color: 'var(--accent)' }}>
                        ${ss.negotiation?.finalPrice?.toFixed(4) ?? agent.pricing.basePrice.toFixed(4)} USDC
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--accent)' }}>
                      {ss.paymentPhase === 'error'
                        ? <span style={{ color: 'var(--red)' }}>❌ Payment failed</span>
                        : <>
                            <span className="spinner" style={{ width: '14px', height: '14px', borderWidth: '2px' }} />
                            Settling payment on Algorand…
                          </>
                      }
                    </div>
                  </div>
                )}

                {/* Executing */}
                {isActive && ss.phase === 'executing' && (
                  <div
                    style={{
                      marginTop: '1.25rem',
                      paddingTop: '1.25rem',
                      borderTop: '1px solid var(--border-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontSize: '0.875rem',
                      color: 'var(--blue)',
                    }}
                  >
                    <span className="spinner" style={{ width: '14px', height: '14px', borderWidth: '2px' }} />
                    Executing via Ollama ({agent?.model ?? 'llama3'})…
                  </div>
                )}

                {/* Result */}
                {ss.result && (
                  <div
                    style={{
                      marginTop: '1rem',
                      padding: '1rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border-subtle)',
                      background: 'var(--bg-base)',
                      fontSize: '0.8125rem',
                      color: 'var(--text-secondary)',
                      lineHeight: '1.65',
                      whiteSpace: 'pre-wrap',
                      maxHeight: '240px',
                      overflowY: 'auto',
                      fontFamily: 'JetBrains Mono, monospace',
                    }}
                  >
                    {ss.result}
                  </div>
                )}

                {/* On-chain proof */}
                {ss.paymentResult?.txHash && isDone && (
                  <div
                    style={{
                      marginTop: '0.75rem',
                      fontSize: '0.75rem',
                      color: 'var(--text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.375rem',
                    }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                    </svg>
                    Settled on-chain:{' '}
                    <a
                      href={`${process.env.NEXT_PUBLIC_ALGORAND_NETWORK === 'mainnet'
                        ? 'https://allo.info/tx'
                        : 'https://testnet.explorer.perawallet.app/tx'}/${ss.paymentResult.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mono-hash"
                    >
                      {ss.paymentResult.txHash.slice(0, 16)}…
                    </a>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Final result */}
      {flowPhase === 'complete' && finalResult && (
        <div
          className="card"
          style={{
            padding: '1.5rem',
            borderColor: 'color-mix(in srgb, var(--accent) 30%, transparent)',
            background: 'color-mix(in srgb, var(--accent) 3%, var(--bg-surface))',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.625rem',
              marginBottom: '1rem',
              color: 'var(--accent)',
              fontWeight: '600',
              fontSize: '0.9375rem',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20,6 9,17 4,12"/>
            </svg>
            Workflow Complete — {steps.length} step{steps.length !== 1 ? 's' : ''} executed
          </div>
          <div
            style={{
              fontSize: '0.8125rem',
              color: 'var(--text-secondary)',
              lineHeight: '1.7',
              whiteSpace: 'pre-wrap',
              maxHeight: '360px',
              overflowY: 'auto',
              fontFamily: 'JetBrains Mono, monospace',
            }}
          >
            {finalResult}
          </div>
          <button
            id="reset-workflow-btn"
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
            className="btn-ghost"
            style={{ marginTop: '1.25rem' }}
          >
            Run another workflow
          </button>
        </div>
      )}
    </div>
  );
}
