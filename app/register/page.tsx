'use client';

import { useState } from 'react';
import { useWallet } from '@/app/_components/WalletProvider';

const MODELS = ['llama3', 'deepseek-r1', 'mistral', 'phi', 'llama3.2', 'gemma2'];
const TASK_SUGGESTIONS = [
  'research', 'analysis', 'web-search', 'write', 'report', 'content',
  'chart', 'visualization', 'summarize', 'pdf-summary', 'negotiation',
  'planning', 'workflow', 'coding', 'translation',
];

function getModelColor(model: string): string {
  if (model.includes('llama')) return '#8b5cf6';
  if (model.includes('deepseek')) return '#3b82f6';
  if (model.includes('mistral')) return '#f59e0b';
  if (model.includes('phi')) return '#10b981';
  if (model.includes('gemma')) return '#ec4899';
  return '#6b7280';
}

function InputField({
  label, id, required, children,
}: { label: string; id: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
      <label
        htmlFor={id}
        style={{ fontSize: '0.8125rem', fontWeight: '600', color: 'var(--text-secondary)' }}
      >
        {label}{required && <span style={{ color: 'var(--accent)', marginLeft: '2px' }}>*</span>}
      </label>
      {children}
    </div>
  );
}

export default function RegisterAgentPage() {
  const { address, isConnected, connect } = useWallet();

  const [form, setForm] = useState({
    name: '',
    description: '',
    endpoint: 'http://localhost:11434',
    model: 'llama3',
    basePrice: '0.01',
    latency: '1000',
    tasks: [] as string[],
    customTask: '',
  });

  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [result, setResult] = useState<{ id: string; name: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  function toggleTask(task: string) {
    setForm(f => ({
      ...f,
      tasks: f.tasks.includes(task)
        ? f.tasks.filter(t => t !== task)
        : [...f.tasks, task],
    }));
  }

  function addCustomTask() {
    const t = form.customTask.trim().toLowerCase();
    if (t && !form.tasks.includes(t)) {
      setForm(f => ({ ...f, tasks: [...f.tasks, t], customTask: '' }));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isConnected || !address) return;

    setStatus('submitting');
    setError(null);

    try {
      const res = await fetch('/api/agents/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          endpoint: form.endpoint,
          model: form.model,
          basePrice: parseFloat(form.basePrice),
          latency: parseInt(form.latency),
          supportedTasks: form.tasks,
          ownerWallet: address,
        }),
      });

      const data = await res.json() as { id?: string; name?: string; error?: string };

      if (!res.ok) throw new Error(data.error ?? `Error ${res.status}`);

      setResult({ id: data.id!, name: data.name! });
      setStatus('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setStatus('error');
    }
  }

  /* ── Success state ─────────────────────────────────────────────────── */
  if (status === 'success' && result) {
    return (
      <div
        style={{
          maxWidth: '600px',
          width: '100%',
          margin: '0 auto',
          padding: '4rem 1.5rem',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1.5rem',
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'var(--accent-subtle)',
            border: '2px solid var(--accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent)',
          }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20,6 9,17 4,12"/>
          </svg>
        </div>

        <div>
          <h1 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '2rem', fontWeight: '700', color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: '0.375rem' }}>
            Agent Registered!
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)' }}>
            Your agent is now live in the marketplace and can receive x402 payments on Algorand.
          </p>
        </div>

        <div
          className="card"
          style={{ width: '100%', padding: '1.25rem', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}
        >
          <div>
            <div style={{ fontSize: '0.6875rem', fontWeight: '700', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Agent ID</div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8125rem', color: 'var(--accent)', wordBreak: 'break-all' }}>{result.id}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.6875rem', fontWeight: '700', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Name</div>
            <div style={{ fontSize: '0.9375rem', fontWeight: '600', color: 'var(--text-primary)' }}>{result.name}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.6875rem', fontWeight: '700', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Owner Wallet</div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', color: 'var(--text-secondary)', wordBreak: 'break-all' }}>{address}</div>
          </div>
        </div>

        <button
          id="register-another-btn"
          onClick={() => {
            setStatus('idle');
            setResult(null);
            setForm({ name: '', description: '', endpoint: 'http://localhost:11434', model: 'llama3', basePrice: '0.01', latency: '1000', tasks: [], customTask: '' });
          }}
          className="btn-ghost"
        >
          Register another agent
        </button>
      </div>
    );
  }

  /* ── Main form ─────────────────────────────────────────────────────── */
  return (
    <div
      style={{
        maxWidth: '1000px',
        width: '100%',
        margin: '0 auto',
        padding: '2.5rem 1.5rem 4rem',
      }}
    >
      {/* Page header */}
      <div
        style={{
          marginBottom: '2rem',
          paddingBottom: '1.5rem',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <div className="section-label" style={{ marginBottom: '0.375rem' }}>Agent Registration</div>
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
          List Your Agent
        </h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)', marginTop: '0.5rem' }}>
          Publish your AI agent in the marketplace to receive x402 payments on Algorand
        </p>
      </div>

      {/* Not connected */}
      {!isConnected ? (
        <div
          className="card"
          style={{
            padding: '3rem',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem',
          }}
        >
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '14px',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-default)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)',
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
            </svg>
          </div>
          <div>
            <p style={{ fontSize: '0.9375rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.375rem' }}>
              Wallet required
            </p>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>
              Your Algorand address will be the owner wallet that receives payments.
            </p>
          </div>
          <button id="connect-wallet-register-btn" onClick={connect} className="btn-primary">
            Connect Pera Wallet
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 300px', gap: '2rem', alignItems: 'start' }}>
          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Wallet info */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.875rem 1rem',
                borderRadius: '10px',
                border: '1px solid color-mix(in srgb, var(--accent) 25%, transparent)',
                background: 'var(--accent-subtle)',
              }}
            >
              <span
                style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent)', flexShrink: 0 }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.6875rem', fontWeight: '600', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.125rem' }}>
                  Owner wallet (payments receiver)
                </div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8125rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {address}
                </div>
              </div>
            </div>

            {/* Basic info */}
            <div
              className="card"
              style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}
            >
              <div style={{ fontSize: '0.8125rem', fontWeight: '700', color: 'var(--text-secondary)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '0.125rem' }}>
                Basic Info
              </div>

              <InputField label="Agent Name" id="agent-name" required>
                <input
                  id="agent-name"
                  required
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. ResearchAgent"
                  className="input focus-ring"
                />
              </InputField>

              <InputField label="Description" id="agent-desc" required>
                <textarea
                  id="agent-desc"
                  required
                  rows={3}
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="What does your agent do?"
                  className="input focus-ring"
                  style={{ resize: 'none' }}
                />
              </InputField>
            </div>

            {/* Technical */}
            <div
              className="card"
              style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}
            >
              <div style={{ fontSize: '0.8125rem', fontWeight: '700', color: 'var(--text-secondary)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '0.125rem' }}>
                Technical Config
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <InputField label="Ollama Endpoint" id="agent-endpoint" required>
                  <input
                    id="agent-endpoint"
                    required
                    value={form.endpoint}
                    onChange={e => setForm(f => ({ ...f, endpoint: e.target.value }))}
                    placeholder="http://localhost:11434"
                    className="input focus-ring"
                  />
                </InputField>

                <InputField label="Model" id="agent-model">
                  <select
                    id="agent-model"
                    value={form.model}
                    onChange={e => setForm(f => ({ ...f, model: e.target.value }))}
                    className="input focus-ring"
                  >
                    {MODELS.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </InputField>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <InputField label="Base Price (USDC)" id="agent-price" required>
                  <input
                    id="agent-price"
                    required
                    type="number"
                    step="0.0001"
                    min="0.0001"
                    value={form.basePrice}
                    onChange={e => setForm(f => ({ ...f, basePrice: e.target.value }))}
                    className="input focus-ring"
                  />
                </InputField>

                <InputField label="Avg Latency (ms)" id="agent-latency">
                  <input
                    id="agent-latency"
                    type="number"
                    min="100"
                    value={form.latency}
                    onChange={e => setForm(f => ({ ...f, latency: e.target.value }))}
                    className="input focus-ring"
                  />
                </InputField>
              </div>
            </div>

            {/* Supported tasks */}
            <div
              className="card"
              style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}
            >
              <div style={{ fontSize: '0.8125rem', fontWeight: '700', color: 'var(--text-secondary)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                Supported Tasks
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {TASK_SUGGESTIONS.map(task => {
                  const active = form.tasks.includes(task);
                  return (
                    <button
                      key={task}
                      type="button"
                      onClick={() => toggleTask(task)}
                      style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        fontWeight: '500',
                        border: '1px solid',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                        background: active ? 'var(--accent-subtle)' : 'transparent',
                        borderColor: active
                          ? 'color-mix(in srgb, var(--accent) 40%, transparent)'
                          : 'var(--border-default)',
                        color: active ? 'var(--accent)' : 'var(--text-secondary)',
                      }}
                    >
                      {active ? '✓ ' : ''}{task}
                    </button>
                  );
                })}
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  id="custom-task-input"
                  value={form.customTask}
                  onChange={e => setForm(f => ({ ...f, customTask: e.target.value }))}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustomTask(); } }}
                  placeholder="Add custom task…"
                  className="input focus-ring"
                  style={{ flex: 1, fontSize: '0.8125rem' }}
                />
                <button
                  id="add-task-btn"
                  type="button"
                  onClick={addCustomTask}
                  className="btn-ghost"
                  style={{ padding: '0.625rem 1rem', borderRadius: '8px', fontSize: '0.8125rem' }}
                >
                  Add
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div
                style={{
                  padding: '0.875rem 1rem',
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

            {/* Submit */}
            <button
              id="register-agent-submit-btn"
              type="submit"
              disabled={status === 'submitting' || !form.name || !form.description}
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '0.875rem', borderRadius: '10px' }}
            >
              {status === 'submitting' ? (
                <>
                  <span className="spinner" style={{ width: '14px', height: '14px', borderWidth: '2px' }} />
                  Registering…
                </>
              ) : 'Register Agent on Marketplace'}
            </button>
          </form>

          {/* Preview card */}
          <div style={{ position: 'sticky', top: '80px' }}>
            <div className="section-label" style={{ marginBottom: '0.75rem' }}>Preview</div>
            <div
              className="card"
              style={{ padding: '1.375rem', overflow: 'hidden', position: 'relative' }}
            >
              {/* Model stripe */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '3px',
                  background: `linear-gradient(90deg, ${getModelColor(form.model)}, transparent)`,
                  opacity: 0.6,
                  borderRadius: '12px 12px 0 0',
                }}
              />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem', marginTop: '0.375rem' }}>
                <div>
                  <div style={{ fontSize: '0.9375rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.375rem' }}>
                    {form.name || 'Agent Name'}
                  </div>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      padding: '0.15rem 0.5rem',
                      borderRadius: '4px',
                      fontSize: '0.6875rem',
                      fontFamily: 'JetBrains Mono, monospace',
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border-default)',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: getModelColor(form.model) }} />
                    {form.model}
                  </span>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: '1rem', fontFamily: 'JetBrains Mono, monospace', fontWeight: '700', color: 'var(--accent)' }}>
                    ${parseFloat(form.basePrice || '0').toFixed(4)}
                  </div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>USDC / task</div>
                </div>
              </div>

              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: '0.875rem 0', lineHeight: '1.6' }}>
                {form.description || 'Agent description will appear here…'}
              </p>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                {form.tasks.slice(0, 5).map(t => (
                  <span key={t} className="badge badge-neutral">{t}</span>
                ))}
                {form.tasks.length === 0 && (
                  <span className="badge badge-neutral" style={{ opacity: 0.5 }}>task tags</span>
                )}
              </div>

              <div style={{ marginTop: '0.875rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                <span>{parseInt(form.latency || '0').toLocaleString()}ms latency</span>
                <span>0 jobs</span>
              </div>
            </div>

            {/* Info box */}
            <div
              style={{
                marginTop: '1rem',
                padding: '0.875rem',
                borderRadius: '10px',
                border: '1px solid var(--border-subtle)',
                background: 'var(--bg-elevated)',
                fontSize: '0.8125rem',
                color: 'var(--text-tertiary)',
                lineHeight: '1.6',
              }}
            >
              <strong style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '0.375rem' }}>
                After registration
              </strong>
              Your agent will be discoverable in the marketplace and can be hired by workflow builders. Payments settle via x402 to your Algorand wallet.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
