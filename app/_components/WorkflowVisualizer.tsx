'use client';

import type { WorkflowStep } from '@/app/_lib/types';

interface WorkflowVisualizerProps {
  steps: WorkflowStep[];
}

function getStatusStyle(status: WorkflowStep['status']): React.CSSProperties {
  switch (status) {
    case 'pending':
      return { background: 'var(--bg-elevated)', border: '2px solid var(--border-default)', color: 'var(--text-muted)' };
    case 'executing':
      return { background: 'var(--amber-subtle)', border: '2px solid var(--amber)', color: 'var(--amber)' };
    case 'completed':
      return { background: 'var(--accent-subtle)', border: '2px solid var(--accent)', color: 'var(--accent)' };
    case 'failed':
      return { background: 'var(--red-subtle)', border: '2px solid var(--red)', color: 'var(--red)' };
  }
}

function StatusIcon({ status }: { status: WorkflowStep['status'] }) {
  if (status === 'completed') {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20,6 9,17 4,12"/>
      </svg>
    );
  }
  if (status === 'executing') {
    return <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', background: 'currentColor', animation: 'pulse-dot 1s infinite' }} />;
  }
  if (status === 'failed') {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    );
  }
  return <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--border-strong)', display: 'block' }} />;
}

export default function WorkflowVisualizer({ steps }: WorkflowVisualizerProps) {
  if (steps.length === 0) return null;

  return (
    <div
      style={{
        width: '100%',
        overflowX: 'auto',
        paddingBottom: '0.5rem',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0',
          minWidth: 'max-content',
          padding: '0.5rem 0',
        }}
      >
        {steps.map((step, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
            {/* Step node */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.5rem',
                minWidth: '130px',
                maxWidth: '160px',
                transition: 'all 0.3s ease',
              }}
            >
              {/* Icon circle */}
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  transition: 'all 0.3s ease',
                  ...getStatusStyle(step.status),
                }}
              >
                <StatusIcon status={step.status} />
              </div>

              {/* Task label */}
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  color: 'var(--text-primary)',
                  textAlign: 'center',
                  lineHeight: '1.3',
                  letterSpacing: '0.02em',
                }}
              >
                {step.task.length > 24 ? step.task.slice(0, 24) + '…' : step.task}
              </span>

              {/* Agent name */}
              {(step.agentName ?? step.requiredAgent) && (
                <span
                  style={{
                    fontSize: '0.6875rem',
                    color: 'var(--text-muted)',
                    textAlign: 'center',
                    lineHeight: '1.2',
                  }}
                >
                  {step.agentName ?? step.requiredAgent}
                </span>
              )}
            </div>

            {/* Arrow connector */}
            {i < steps.length - 1 && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0 0.5rem',
                  color: 'var(--border-strong)',
                  flexShrink: 0,
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"/>
                  <polyline points="12,5 19,12 12,19"/>
                </svg>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
