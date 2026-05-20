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

  const priceRange = agent.pricing.basePrice * 1.3;

  function getPricePercent(price: number) {
    return Math.min(100, Math.max(0, (price / priceRange) * 100));
  }

  return (
    <div
      style={{
        padding: '1.125rem',
        borderRadius: '10px',
        border: '1px solid var(--border-default)',
        background: 'var(--bg-base)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.875rem',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>
            Negotiating with {agent.name}
          </span>
        </div>

        {(phase === 'offering' || phase === 'countering') && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <span className="spinner" style={{ width: '11px', height: '11px', borderWidth: '1.5px' }} />
            {phase === 'offering' ? 'Sending offer…' : 'Evaluating counter…'}
          </div>
        )}

        {phase === 'accepted' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.75rem', color: 'var(--accent)' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20,6 9,17 4,12"/>
            </svg>
            Agreed
          </div>
        )}
      </div>

      {/* Price rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {/* Agent asks */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.625rem 0.875rem',
            borderRadius: '8px',
            border: '1px solid var(--border-subtle)',
            background: 'var(--bg-surface)',
            opacity: phase === 'idle' ? 0.5 : 1,
            transition: 'all 0.2s ease',
          }}
        >
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Agent asks</span>
          <span style={{ fontSize: '0.875rem', fontFamily: 'JetBrains Mono, monospace', fontWeight: '600', color: 'var(--text-primary)' }}>
            ${agent.pricing.basePrice.toFixed(4)} USDC
          </span>
        </div>

        {/* Counter offer */}
        {offer?.counter != null && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.625rem 0.875rem',
              borderRadius: '8px',
              border: '1px solid color-mix(in srgb, var(--amber) 30%, transparent)',
              background: 'var(--amber-subtle)',
              transition: 'all 0.3s ease',
            }}
          >
            <span style={{ fontSize: '0.8125rem', color: 'var(--amber)' }}>Counter offer</span>
            <span style={{ fontSize: '0.875rem', fontFamily: 'JetBrains Mono, monospace', fontWeight: '600', color: 'var(--amber)' }}>
              ${offer.counter.toFixed(4)} USDC
            </span>
          </div>
        )}

        {/* Final / agreed */}
        {phase === 'accepted' && offer?.finalPrice != null && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.625rem 0.875rem',
              borderRadius: '8px',
              border: '1px solid color-mix(in srgb, var(--accent) 35%, transparent)',
              background: 'var(--accent-subtle)',
              transition: 'all 0.3s ease',
            }}
          >
            <span style={{ fontSize: '0.8125rem', fontWeight: '600', color: 'var(--accent)' }}>✓ Agreed price</span>
            <span style={{ fontSize: '0.9375rem', fontFamily: 'JetBrains Mono, monospace', fontWeight: '700', color: 'var(--accent)' }}>
              ${offer.finalPrice.toFixed(4)} USDC
            </span>
          </div>
        )}
      </div>

      {/* Price bar visualization */}
      {phase !== 'idle' && offer?.finalPrice != null && (
        <div>
          <div
            style={{
              height: '4px',
              borderRadius: '9999px',
              background: 'var(--border-default)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                height: '100%',
                width: `${getPricePercent(offer.finalPrice)}%`,
                background: 'var(--accent)',
                borderRadius: '9999px',
                transition: 'width 0.6s ease',
              }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem' }}>
            <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>$0</span>
            <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>${priceRange.toFixed(4)}</span>
          </div>
        </div>
      )}

      {/* Reasoning */}
      {reasoning && phase === 'accepted' && (
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic', lineHeight: '1.5', margin: 0 }}>
          {reasoning}
        </p>
      )}
    </div>
  );
}
