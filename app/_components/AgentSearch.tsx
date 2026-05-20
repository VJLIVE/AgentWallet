'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Agent } from '@/app/_lib/types';
import AgentCard from './AgentCard';

interface AgentSearchProps {
  agents: Agent[];
}

export default function AgentSearch({ agents }: AgentSearchProps) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Agent | null>(null);
  const router = useRouter();

  const filtered = query.trim()
    ? agents.filter(
        (a) =>
          a.name.toLowerCase().includes(query.toLowerCase()) ||
          a.description.toLowerCase().includes(query.toLowerCase()) ||
          a.supportedTasks.some((t) => t.toLowerCase().includes(query.toLowerCase())) ||
          a.model.toLowerCase().includes(query.toLowerCase())
      )
    : agents;

  return (
    <div className="space-y-6">
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">🔍</span>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, task, or model..."
          className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-100 placeholder-zinc-500 text-sm focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 transition-colors"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 text-sm"
          >
            ✕
          </button>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="text-zinc-500 text-sm">
          {filtered.length} agent{filtered.length !== 1 ? 's' : ''} found
        </div>
        {selected && (
          <div className="flex items-center gap-3">
            <span className="text-zinc-400 text-sm">
              Selected: <span className="text-zinc-200 font-medium">{selected.name}</span>
            </span>
            <button
              onClick={() => router.push(`/workflow?agent=${selected.id}`)}
              className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-sm transition-colors"
            >
              Hire Agent →
            </button>
            <button
              onClick={() => setSelected(null)}
              className="text-zinc-500 hover:text-zinc-300 text-sm"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((agent) => (
          <AgentCard
            key={agent.id}
            agent={agent}
            selected={selected?.id === agent.id}
            onSelect={(a) => setSelected(selected?.id === a.id ? null : a)}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-zinc-600">
          <div className="text-4xl mb-3">🤖</div>
          <div>No agents match &quot;{query}&quot;</div>
        </div>
      )}
    </div>
  );
}
