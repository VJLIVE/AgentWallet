'use client';

import type { Agent } from '@/app/_lib/types';

interface AgentCardProps {
  agent: Agent;
  onSelect?: (agent: Agent) => void;
  selected?: boolean;
}

function StarRating({ value }: { value: number }) {
  const full = Math.floor(value);
  const partial = value - full;
  return (
    <span className="text-amber-400 text-sm" aria-label={`${value} stars`}>
      {Array.from({ length: 5 }, (_, i) => {
        if (i < full) return <span key={i}>★</span>;
        if (i === full && partial >= 0.5) return <span key={i} className="opacity-50">★</span>;
        return <span key={i} className="text-zinc-600">★</span>;
      })}
      <span className="ml-1 text-zinc-400 font-mono">{value.toFixed(1)}</span>
    </span>
  );
}

export default function AgentCard({ agent, onSelect, selected }: AgentCardProps) {
  return (
    <div
      onClick={() => onSelect?.(agent)}
      className={`
        relative flex flex-col gap-3 p-5 rounded-xl border bg-zinc-900 transition-all duration-200
        ${onSelect ? 'cursor-pointer hover:bg-zinc-800 hover:border-zinc-600' : ''}
        ${selected
          ? 'border-emerald-500 ring-1 ring-emerald-500/40 shadow-lg shadow-emerald-900/20'
          : 'border-zinc-800'
        }
      `}
    >
      {selected && (
        <span className="absolute top-3 right-3 text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full px-2 py-0.5">
          Selected
        </span>
      )}

      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-zinc-100 font-semibold text-base leading-tight">{agent.name}</h3>
          <span className="inline-block mt-1 text-xs font-mono bg-zinc-800 text-zinc-400 border border-zinc-700 rounded px-2 py-0.5">
            {agent.model}
          </span>
        </div>
        <div className="text-right shrink-0">
          <div className="text-emerald-400 font-mono font-semibold text-sm">
            ${agent.pricing.basePrice.toFixed(4)} USDC
          </div>
          <div className="text-zinc-500 text-xs">per task</div>
        </div>
      </div>

      <p className="text-zinc-400 text-sm leading-relaxed line-clamp-2">{agent.description}</p>

      <div className="flex items-center justify-between">
        <StarRating value={agent.reputation} />
        <span className="text-zinc-500 text-xs font-mono">{agent.latency}ms</span>
      </div>

      <div className="flex items-center justify-between text-xs text-zinc-500">
        <span>{agent.totalJobs.toLocaleString()} jobs completed</span>
      </div>

      <div className="flex flex-wrap gap-1.5 mt-1">
        {agent.supportedTasks.map((task) => (
          <span
            key={task}
            className="text-xs bg-zinc-800 text-zinc-400 border border-zinc-700 rounded-full px-2 py-0.5"
          >
            {task}
          </span>
        ))}
      </div>
    </div>
  );
}
