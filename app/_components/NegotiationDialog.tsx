'use client';

import { useEffect, useState } from 'react';
import type { Agent, NegotiationOffer } from '@/app/_lib/types';

interface NegotiationDialogProps {
  agent: Agent;
  budget: number;
  onComplete: (offer: NegotiationOffer) => void;
}

type NegotiationPhase = 'idle' | 'offering' | 'countering' | 'accepted' | 'error';

export default function NegotiationDialog({ agent, budget, onComplete }: NegotiationDialogProps) {
  const [phase, setPhase] = useState<NegotiationPhase>('idle');
  const [offer, setOffer] = useState<NegotiationOffer | null>(null);
  const [reasoning, setReasoning] = useState<string>('');

  useEffect(() => {
    let cancelled = false;

    async function runNegotiation() {
      setPhase('offering');

      try {
        // Call real /api/negotiate — uses Ollama (deepseek-r1) or rule-based fallback
        const res = await fetch('/api/negotiate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ agentId: agent.id, budget }),
        });

        if (!res.ok) throw new Error(`Negotiate API error: ${res.status}`);
        const data = await res.json() as {
          initialOffer: number;
          counter: number;
          finalPrice: number;
          reasoning: string;
        };

        if (cancelled) return;

        const needsCounter = data.counter < data.initialOffer;
        if (needsCounter) {
          setPhase('countering');
          // Brief pause so the UI shows the counter step
          await new Promise(r => setTimeout(r, 700));
          if (cancelled) return;
        }

        const result: NegotiationOffer = {
          agentId: agent.id,
          initialOffer: data.initialOffer,
          counter: needsCounter ? data.counter : undefined,
          finalPrice: data.finalPrice,
          accepted: true,
        };

        setOffer(result);
        setReasoning(data.reasoning);
        setPhase('accepted');

        await new Promise(r => setTimeout(r, 400));
        if (cancelled) return;
        onComplete(result);
      } catch (err) {
        if (cancelled) return;
        console.error('Negotiation failed:', err);
        setPhase('error');
        // Fallback: accept at asking price
        const fallback: NegotiationOffer = {
          agentId: agent.id,
          initialOffer: agent.pricing.basePrice,
          finalPrice: agent.pricing.basePrice,
          accepted: true,
        };
        setOffer(fallback);
        onComplete(fallback);
      }
    }

    runNegotiation();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agent.id]);

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-zinc-300">
        <span>🤝</span>
        <span>Negotiating with {agent.name}</span>
        {phase === 'offering' || phase === 'countering' ? (
          <span className="ml-auto text-xs text-zinc-500 flex items-center gap-1">
            <span className="animate-spin inline-block">⟳</span>
            {phase === 'offering' ? 'Sending offer...' : 'Evaluating counter...'}
          </span>
        ) : null}
      </div>

      <div className="space-y-2 text-sm">
        {/* Initial offer */}
        <div className={`flex items-center justify-between px-3 py-2 rounded-lg border transition-all duration-300 ${
          phase !== 'idle'
            ? 'border-zinc-700 bg-zinc-800 text-zinc-300'
            : 'border-zinc-800 bg-zinc-900 text-zinc-600'
        }`}>
          <span>Agent asks</span>
          <span className="font-mono font-semibold text-zinc-200">
            ${agent.pricing.basePrice.toFixed(4)} USDC
          </span>
        </div>

        {/* Counter offer */}
        {offer?.counter != null && (
          <div className={`flex items-center justify-between px-3 py-2 rounded-lg border transition-all duration-300 ${
            phase === 'countering' || phase === 'accepted'
              ? 'border-amber-700/50 bg-amber-950/20 text-amber-300'
              : 'border-zinc-800 bg-zinc-900 text-zinc-600'
          }`}>
            <span>Counter offer</span>
            <span className="font-mono font-semibold">
              ${offer.counter.toFixed(4)} USDC
            </span>
          </div>
        )}

        {/* Final price */}
        {phase === 'accepted' && offer?.finalPrice != null && (
          <div className="flex items-center justify-between px-3 py-2 rounded-lg border border-emerald-500/40 bg-emerald-950/20 text-emerald-300">
            <span className="font-semibold">✓ Agreed price</span>
            <span className="font-mono font-bold">
              ${offer.finalPrice.toFixed(4)} USDC
            </span>
          </div>
        )}

        {/* Reasoning from Ollama */}
        {reasoning && phase === 'accepted' && (
          <p className="text-xs text-zinc-500 px-1 italic">{reasoning}</p>
        )}
      </div>
    </div>
  );
}
