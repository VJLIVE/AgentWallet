'use client';

import type { Agent } from '@/app/_lib/types';

interface AgentCardProps {
  agent: Agent;
  onSelect?: (agent: Agent) => void;
  selected?: boolean;
}

function getModelClass(model: string): string {
  const m = model.toLowerCase();
  if (m.includes('llama')) return 'model-llama3';
  if (m.includes('deepseek')) return 'model-deepseek';
  if (m.includes('mistral')) return 'model-mistral';
  if (m.includes('phi')) return 'model-phi';
  if (m.includes('gemma')) return 'model-gemma';
  return 'model-default';
}

function getModelColor(model: string): string {
  const m = model.toLowerCase();
  if (m.includes('llama')) return '#8b5cf6';
  if (m.includes('deepseek')) return '#3b82f6';
  if (m.includes('mistral')) return '#f59e0b';
  if (m.includes('phi')) return '#10b981';
  if (m.includes('gemma')) return '#ec4899';
  return '#6b7280';
}

function StarRating({ value }: { value: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
      {Array.from({ length: 5 }, (_, i) => {
        const filled = i < Math.floor(value);
        const partial = !filled && i === Math.floor(value) && value % 1 >= 0.5;
        return (
          <svg
            key={i}
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill={filled || partial ? 'var(--amber)' : 'none'}
            stroke="var(--amber)"
            strokeWidth="1.5"
            opacity={partial ? 0.5 : 1}
          >
            <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
          </svg>
        );
      })}
      <span
        style={{
          fontSize: '0.75rem',
          fontFamily: 'JetBrains Mono, monospace',
          color: 'var(--text-secondary)',
          marginLeft: '0.125rem',
        }}
      >
        {value.toFixed(1)}
      </span>
    </div>
  );
}

export default function AgentCard({ agent, onSelect, selected }: AgentCardProps) {
  const modelColor = getModelColor(agent.model);

  return (
    <div
      onClick={() => onSelect?.(agent)}
      className={`card ${onSelect ? 'card-hover' : ''}`}
      style={{
        position: 'relative',
        padding: '1.375rem',
        cursor: onSelect ? 'pointer' : 'default',
        borderColor: selected
          ? 'var(--accent)'
          : undefined,
        boxShadow: selected
          ? '0 0 0 2px color-mix(in srgb, var(--accent) 20%, transparent)'
          : undefined,
        transition: 'all 0.2s ease',
        overflow: 'hidden',
      }}
    >
      {/* Model color stripe */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: `linear-gradient(90deg, ${modelColor}, transparent)`,
          opacity: 0.6,
          borderRadius: '12px 12px 0 0',
        }}
      />

      {/* Selected badge */}
      {selected && (
        <div
          className="badge badge-accent"
          style={{ position: 'absolute', top: '1rem', right: '1rem' }}
        >
          ✓ Selected
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem', marginTop: '0.25rem' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3
            style={{
              fontSize: '0.9375rem',
              fontWeight: '600',
              color: 'var(--text-primary)',
              lineHeight: '1.3',
              marginBottom: '0.375rem',
            }}
          >
            {agent.name}
          </h3>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
              padding: '0.15rem 0.5rem',
              borderRadius: '4px',
              fontSize: '0.6875rem',
              fontFamily: 'JetBrains Mono, monospace',
              fontWeight: '500',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-default)',
              color: 'var(--text-secondary)',
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: modelColor,
                flexShrink: 0,
              }}
            />
            {agent.model}
          </span>
        </div>

        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div
            style={{
              fontSize: '1rem',
              fontFamily: 'JetBrains Mono, monospace',
              fontWeight: '600',
              color: 'var(--accent)',
              lineHeight: '1.2',
            }}
          >
            ${agent.pricing.basePrice.toFixed(4)}
          </div>
          <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '0.125rem' }}>
            {Math.ceil(agent.pricing.basePrice * 100)} credits
          </div>
        </div>
      </div>

      {/* Description */}
      <p
        style={{
          fontSize: '0.8125rem',
          color: 'var(--text-secondary)',
          lineHeight: '1.6',
          margin: '0.875rem 0',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {agent.description}
      </p>

      {/* Metrics row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '0.875rem',
        }}
      >
        <StarRating value={agent.reputation} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
            {agent.latency}ms
          </span>
          <span
            style={{
              width: '1px',
              height: '10px',
              background: 'var(--border-default)',
            }}
          />
          <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
            {agent.totalJobs.toLocaleString()} jobs
          </span>
        </div>
      </div>

      {/* Task tags */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
        {agent.supportedTasks.slice(0, 4).map((task) => (
          <span key={task} className="badge badge-neutral">
            {task}
          </span>
        ))}
        {agent.supportedTasks.length > 4 && (
          <span className="badge badge-neutral">
            +{agent.supportedTasks.length - 4}
          </span>
        )}
      </div>
    </div>
  );
}
