'use client';

import type { WorkflowStep } from '@/app/_lib/types';

interface WorkflowVisualizerProps {
  steps: WorkflowStep[];
}

function statusIcon(status: WorkflowStep['status']) {
  switch (status) {
    case 'pending': return '⏳';
    case 'executing': return '⚡';
    case 'completed': return '✅';
    case 'failed': return '❌';
  }
}

function statusColor(status: WorkflowStep['status']) {
  switch (status) {
    case 'pending': return 'border-zinc-700 bg-zinc-900 text-zinc-400';
    case 'executing': return 'border-amber-500/60 bg-amber-950/30 text-amber-300 shadow-lg shadow-amber-900/20';
    case 'completed': return 'border-emerald-500/60 bg-emerald-950/30 text-emerald-300';
    case 'failed': return 'border-red-500/60 bg-red-950/30 text-red-300';
  }
}

export default function WorkflowVisualizer({ steps }: WorkflowVisualizerProps) {
  if (steps.length === 0) return null;

  return (
    <div className="w-full overflow-x-auto">
      <div className="flex items-center gap-2 min-w-max py-4 px-2">
        {steps.map((step, i) => (
          <div key={i} className="flex items-center gap-2">
            <div
              className={`
                flex flex-col items-center gap-1.5 px-4 py-3 rounded-xl border min-w-[120px] transition-all duration-300
                ${statusColor(step.status)}
                ${step.status === 'executing' ? 'animate-pulse' : ''}
              `}
            >
              <span className="text-xl">{statusIcon(step.status)}</span>
              <span className="text-xs font-semibold uppercase tracking-wide">{step.task}</span>
              {step.agentName || step.requiredAgent ? (
                <span className="text-xs opacity-70 text-center leading-tight">
                  {step.agentName ?? step.requiredAgent}
                </span>
              ) : null}
            </div>
            {i < steps.length - 1 && (
              <span className="text-zinc-600 text-lg font-bold select-none">→</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
