-- AgentWallet Supabase Schema
-- Run this in the Supabase SQL Editor

-- ─── Extensions ──────────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ─── Agents Table ─────────────────────────────────────────────────────────────
create table if not exists agents (
  id              uuid primary key default uuid_generate_v4(),
  name            text not null,
  description     text not null,
  endpoint        text not null,
  supported_tasks text[] not null default '{}',
  base_price      numeric(18, 6) not null,  -- USDC
  per_token       numeric(18, 9) not null default 0,
  reputation      numeric(3, 1) not null default 5.0,
  total_jobs      integer not null default 0,
  owner_wallet    text not null,             -- Algorand address
  model           text not null,
  latency         integer not null default 1000, -- ms
  created_at      timestamptz not null default now()
);

-- ─── Jobs Table ───────────────────────────────────────────────────────────────
create table if not exists jobs (
  id               uuid primary key default uuid_generate_v4(),
  requester_wallet text not null,            -- Algorand address
  provider_agent_id uuid references agents(id),
  task             text not null,
  payment_amount   numeric(18, 6) not null,  -- USDC
  status           text not null default 'pending'
                   check (status in ('pending','negotiating','executing','completed','failed')),
  tx_hash          text unique,              -- Algorand transaction ID (unique: one payment = one job)
  result_hash      text,                     -- SHA-256 of result
  result           text,
  created_at       timestamptz not null default now(),
  completed_at     timestamptz
);

-- ─── Transactions Table ───────────────────────────────────────────────────────
create table if not exists transactions (
  id           uuid primary key default uuid_generate_v4(),
  tx_hash      text not null unique,         -- Algorand transaction ID
  sender       text not null,               -- Algorand address
  receiver     text not null,               -- Algorand address
  amount       numeric(18, 6) not null,     -- USDC
  asa_id       text not null,               -- ASA ID
  resource     text not null,               -- x402 resource path
  x402_version integer not null default 2,
  network      text not null,               -- CAIP-2 network identifier
  confirmed    boolean not null default false,
  created_at   timestamptz not null default now()
);

-- ─── Reputation Table ─────────────────────────────────────────────────────────
create table if not exists reputation (
  agent_id         uuid primary key references agents(id),
  score            numeric(3, 1) not null default 5.0,
  successful_jobs  integer not null default 0,
  failed_jobs      integer not null default 0,
  disputes         integer not null default 0,
  updated_at       timestamptz not null default now()
);

-- ─── Row Level Security ───────────────────────────────────────────────────────
alter table agents enable row level security;
alter table jobs enable row level security;
alter table transactions enable row level security;
alter table reputation enable row level security;

-- Public read access for agents, transactions, reputation
create policy "agents_public_read" on agents for select using (true);
create policy "transactions_public_read" on transactions for select using (true);
create policy "transactions_insert" on transactions for insert with check (true);
create policy "reputation_public_read" on reputation for select using (true);

-- Jobs: public read, authenticated insert
create policy "jobs_public_read" on jobs for select using (true);
create policy "jobs_insert" on jobs for insert with check (true);
create policy "jobs_update" on jobs for update using (true);

-- Agents: anyone can register (insert), service role updates stats
create policy "agents_insert" on agents for insert with check (true);
create policy "agents_update" on agents for update using (true);

-- Service role can do everything (bypasses RLS)

-- ─── Helper Functions ────────────────────────────────────────────────────────
-- Atomically increments total_jobs on an agent and updates reputation score.
create or replace function increment_agent_jobs(agent_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  update agents
    set total_jobs = total_jobs + 1
    where id = agent_id;

  update reputation
    set
      successful_jobs = successful_jobs + 1,
      score = least(5.0, score + 0.01),
      updated_at = now()
    where reputation.agent_id = increment_agent_jobs.agent_id;
end;
$$;

-- ─── Seed Data ────────────────────────────────────────────────────────────────
-- Insert default agents. Replace owner_wallet with real Algorand testnet addresses.
insert into agents (name, description, endpoint, supported_tasks, base_price, per_token, reputation, total_jobs, owner_wallet, model, latency)
values
  (
    'ResearchAgent',
    'Performs deep web research and data analysis on any topic. Aggregates sources and produces structured findings.',
    'http://localhost:11434',
    array['research', 'analysis', 'web-search', 'data-gathering'],
    0.020000, 0.000002, 4.8, 412,
    'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
    'llama3', 1200
  ),
  (
    'WriterAgent',
    'Generates high-quality written content, reports, articles, and documentation from structured inputs.',
    'http://localhost:11434',
    array['write', 'report', 'content', 'documentation', 'summary'],
    0.015000, 0.0000015, 4.9, 329,
    'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB',
    'llama3', 900
  ),
  (
    'VisualizationAgent',
    'Creates charts, graphs, and visual data representations from raw data or analysis results.',
    'http://localhost:11434',
    array['chart', 'visualization', 'graph', 'plot', 'visual'],
    0.010000, 0.000001, 4.7, 201,
    'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAC',
    'phi', 600
  ),
  (
    'SummarizerAgent',
    'Condenses long documents, PDFs, and text into concise, accurate summaries with key takeaways.',
    'http://localhost:11434',
    array['pdf-summary', 'summarize', 'condense', 'tldr', 'summary'],
    0.008000, 0.0000008, 4.6, 567,
    'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD',
    'mistral', 450
  ),
  (
    'NegotiatorAgent',
    'Handles price negotiation and contract optimization between agents using advanced reasoning.',
    'http://localhost:11434',
    array['negotiation', 'pricing', 'contract', 'optimization'],
    0.005000, 0.0000005, 4.9, 89,
    'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAE',
    'deepseek-r1', 2100
  ),
  (
    'PlannerAgent',
    'Decomposes complex user requests into structured multi-step workflows and assigns optimal agents.',
    'http://localhost:11434',
    array['planning', 'task-decomposition', 'workflow', 'orchestration'],
    0.012000, 0.0000012, 4.8, 156,
    'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAF',
    'llama3', 800
  )
on conflict do nothing;

-- Insert reputation rows for seeded agents
insert into reputation (agent_id, score, successful_jobs, failed_jobs)
select id, reputation, total_jobs, 0 from agents
on conflict do nothing;
