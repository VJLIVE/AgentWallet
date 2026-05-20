'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Agent } from '@/app/_lib/types';
import AgentCard from './AgentCard';

interface AgentSearchProps {
  agents: Agent[];
}

const ALL_TASKS = ['research', 'analysis', 'write', 'summarize', 'chart', 'planning', 'coding', 'translation'];

export default function AgentSearch({ agents }: AgentSearchProps) {
  const [query, setQuery] = useState('');
  const [activeTask, setActiveTask] = useState<string | null>(null);
  const [selected, setSelected] = useState<Agent | null>(null);
  const router = useRouter();

  const filtered = agents.filter((a) => {
    const matchesQuery =
      !query.trim() ||
      a.name.toLowerCase().includes(query.toLowerCase()) ||
      a.description.toLowerCase().includes(query.toLowerCase()) ||
      a.supportedTasks.some((t) => t.toLowerCase().includes(query.toLowerCase())) ||
      a.model.toLowerCase().includes(query.toLowerCase());

    const matchesTask =
      !activeTask || a.supportedTasks.some((t) => t.toLowerCase().includes(activeTask));

    return matchesQuery && matchesTask;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Search + filter bar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
        {/* Search input */}
        <div style={{ position: 'relative' }}>
          <div
            style={{
              position: 'absolute',
              left: '0.875rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
              pointerEvents: 'none',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, task, or model…"
            className="input focus-ring"
            style={{ paddingLeft: '2.5rem', paddingRight: query ? '2.5rem' : '0.875rem' }}
            id="agent-search-input"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              style={{
                position: 'absolute',
                right: '0.875rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '2px',
                lineHeight: 1,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          )}
        </div>

        {/* Task filter chips */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '500' }}>Filter:</span>
          <button
            onClick={() => setActiveTask(null)}
            style={{
              padding: '0.25rem 0.75rem',
              borderRadius: '9999px',
              fontSize: '0.75rem',
              fontWeight: '500',
              border: '1px solid',
              cursor: 'pointer',
              transition: 'all 0.15s',
              background: activeTask === null ? 'var(--text-primary)' : 'transparent',
              borderColor: activeTask === null ? 'var(--text-primary)' : 'var(--border-default)',
              color: activeTask === null ? 'var(--bg-base)' : 'var(--text-secondary)',
            }}
          >
            All
          </button>
          {ALL_TASKS.map((task) => (
            <button
              key={task}
              onClick={() => setActiveTask(activeTask === task ? null : task)}
              style={{
                padding: '0.25rem 0.75rem',
                borderRadius: '9999px',
                fontSize: '0.75rem',
                fontWeight: '500',
                border: '1px solid',
                cursor: 'pointer',
                transition: 'all 0.15s',
                background: activeTask === task ? 'var(--accent-subtle)' : 'transparent',
                borderColor: activeTask === task
                  ? 'color-mix(in srgb, var(--accent) 35%, transparent)'
                  : 'var(--border-default)',
                color: activeTask === task ? 'var(--accent)' : 'var(--text-secondary)',
              }}
            >
              {task}
            </button>
          ))}
        </div>
      </div>

      {/* Results header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}
      >
        <span style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>
          {filtered.length} agent{filtered.length !== 1 ? 's' : ''} found
        </span>

        {selected && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
              Selected:{' '}
              <strong style={{ color: 'var(--text-primary)' }}>{selected.name}</strong>
            </span>
            <button
              onClick={() => router.push(`/workflow?agent=${selected.id}`)}
              className="btn-accent"
              style={{ padding: '0.375rem 1rem', borderRadius: '9999px', fontSize: '0.8125rem' }}
              id="hire-agent-btn"
            >
              Hire Agent →
            </button>
            <button
              onClick={() => setSelected(null)}
              style={{
                color: 'var(--text-muted)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '2px',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '1rem',
        }}
      >
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
        <div
          style={{
            textAlign: 'center',
            padding: '4rem 1rem',
            color: 'var(--text-muted)',
          }}
        >
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🤖</div>
          <div style={{ fontSize: '0.9375rem', fontWeight: '500', color: 'var(--text-tertiary)' }}>
            No agents match &quot;{query}&quot;
          </div>
          <div style={{ fontSize: '0.8125rem', marginTop: '0.375rem' }}>
            Try a different search or clear filters
          </div>
        </div>
      )}
    </div>
  );
}
