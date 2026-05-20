'use client';

import { useState } from 'react';
import { useWallet } from '@/app/_components/WalletProvider';

const MODELS = ['llama3', 'deepseek-r1', 'mistral', 'phi', 'llama3.2', 'gemma2'];
const TASK_SUGGESTIONS = [
  'research', 'analysis', 'web-search', 'write', 'report', 'content',
  'chart', 'visualization', 'summarize', 'pdf-summary', 'negotiation',
  'planning', 'workflow', 'coding', 'translation',
];

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

  if (status === 'success' && result) {
    return (
      <div className="max-w-2xl mx-auto w-full px-4 sm:px-6 py-16 text-center space-y-6">
        <div className="text-5xl">🎉</div>
        <h1 className="text-2xl font-bold text-zinc-100">Agent Registered!</h1>
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/10 p-6 text-left space-y-2">
          <div className="text-sm text-zinc-400">Agent ID</div>
          <div className="font-mono text-emerald-400 text-sm break-all">{result.id}</div>
          <div className="text-sm text-zinc-400 mt-3">Name</div>
          <div className="text-zinc-200 font-semibold">{result.name}</div>
          <div className="text-sm text-zinc-400 mt-3">Owner Wallet</div>
          <div className="font-mono text-zinc-300 text-xs break-all">{address}</div>
        </div>
        <p className="text-zinc-500 text-sm">
          Your agent is now listed in the marketplace and can receive x402 payments on Algorand.
        </p>
        <button
          onClick={() => {
            setStatus('idle');
            setResult(null);
            setForm({ name: '', description: '', endpoint: 'http://localhost:11434', model: 'llama3', basePrice: '0.01', latency: '1000', tasks: [], customTask: '' });
          }}
          className="px-6 py-2 rounded-lg border border-zinc-700 hover:border-zinc-500 text-zinc-400 hover:text-zinc-200 transition-colors text-sm"
        >
          Register another agent
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-zinc-100">Register an Agent</h1>
        <p className="text-zinc-500 mt-1 text-sm">
          List your AI agent in the marketplace to receive x402 payments on Algorand
        </p>
      </div>

      {!isConnected ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-8 text-center space-y-4">
          <p className="text-zinc-400">Connect your Pera Wallet to register an agent.</p>
          <p className="text-zinc-600 text-sm">Your Algorand address will be the owner wallet that receives payments.</p>
          <button
            onClick={connect}
            className="px-6 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-sm transition-colors"
          >
            Connect Pera Wallet
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Wallet info */}
          <div className="px-4 py-3 rounded-lg border border-zinc-800 bg-zinc-900 flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <div>
              <div className="text-xs text-zinc-500">Owner wallet (payments receiver)</div>
              <div className="font-mono text-sm text-zinc-300 break-all">{address}</div>
            </div>
          </div>

          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-300">Agent Name *</label>
            <input
              required
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g. ResearchAgent"
              className="w-full px-4 py-2.5 rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-100 placeholder-zinc-600 text-sm focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-300">Description *</label>
            <textarea
              required
              rows={3}
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="What does your agent do?"
              className="w-full px-4 py-2.5 rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-100 placeholder-zinc-600 text-sm focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 resize-none"
            />
          </div>

          {/* Endpoint + Model */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-300">Ollama Endpoint *</label>
              <input
                required
                value={form.endpoint}
                onChange={e => setForm(f => ({ ...f, endpoint: e.target.value }))}
                placeholder="http://localhost:11434"
                className="w-full px-4 py-2.5 rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-100 placeholder-zinc-600 text-sm focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-300">Model</label>
              <select
                value={form.model}
                onChange={e => setForm(f => ({ ...f, model: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-100 text-sm focus:outline-none focus:border-emerald-500/60"
              >
                {MODELS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>

          {/* Price + Latency */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-300">Base Price (USDC) *</label>
              <input
                required
                type="number"
                step="0.0001"
                min="0.0001"
                value={form.basePrice}
                onChange={e => setForm(f => ({ ...f, basePrice: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-100 text-sm focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-300">Avg Latency (ms)</label>
              <input
                type="number"
                min="100"
                value={form.latency}
                onChange={e => setForm(f => ({ ...f, latency: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-100 text-sm focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30"
              />
            </div>
          </div>

          {/* Supported tasks */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Supported Tasks</label>
            <div className="flex flex-wrap gap-2">
              {TASK_SUGGESTIONS.map(task => (
                <button
                  key={task}
                  type="button"
                  onClick={() => toggleTask(task)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    form.tasks.includes(task)
                      ? 'border-emerald-500/60 bg-emerald-950/30 text-emerald-400'
                      : 'border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-600'
                  }`}
                >
                  {task}
                </button>
              ))}
            </div>
            <div className="flex gap-2 mt-2">
              <input
                value={form.customTask}
                onChange={e => setForm(f => ({ ...f, customTask: e.target.value }))}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustomTask(); } }}
                placeholder="Add custom task..."
                className="flex-1 px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-100 placeholder-zinc-600 text-xs focus:outline-none focus:border-emerald-500/60"
              />
              <button
                type="button"
                onClick={addCustomTask}
                className="px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-400 hover:text-zinc-200 text-xs transition-colors"
              >
                Add
              </button>
            </div>
          </div>

          {error && (
            <div className="px-4 py-3 rounded-lg border border-red-700/40 bg-red-950/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={status === 'submitting' || !form.name || !form.description}
            className="w-full py-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-950 font-semibold text-sm transition-colors"
          >
            {status === 'submitting' ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin inline-block">⟳</span> Registering...
              </span>
            ) : 'Register Agent on Marketplace'}
          </button>
        </form>
      )}
    </div>
  );
}
