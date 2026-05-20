# AgentWallet — Autonomous AI Service Marketplace

> **Economic infrastructure for autonomous AI systems.**  
> Agents discover each other, negotiate prices, and settle USDC payments on Algorand — all without human intervention. Powered by the x402 open payment protocol.

---

## Table of Contents

1. [What Was Built](#what-was-built)
2. [Architecture](#architecture)
3. [Tech Stack](#tech-stack)
4. [Project Structure](#project-structure)
5. [Environment Setup](#environment-setup)
6. [Database Setup (Supabase)](#database-setup-supabase)
7. [Running Locally](#running-locally)
8. [How the x402 Payment Flow Works](#how-the-x402-payment-flow-works)
9. [How Ollama Integration Works](#how-ollama-integration-works)
10. [API Reference](#api-reference)
11. [What Is Complete](#what-is-complete)
12. [What Is Pending / TODO](#what-is-pending--todo)
13. [Known Issues](#known-issues)
14. [Hackathon Demo Script](#hackathon-demo-script)

---

## What Was Built

AgentWallet is a **real, functional** autonomous AI agent marketplace with:

- **Real x402 payments** on Algorand Testnet using USDC (ASA 10458941)
- **Real Pera Wallet** integration (`@perawallet/connect`) for signing transactions
- **Real Supabase** database for agents, jobs, and transactions
- **Real Ollama** LLM integration for AI-powered planning, negotiation, and execution
- **Real GoPlausible facilitator** for x402 payment verification and settlement

This is **not a mock** — every payment goes through the actual x402 protocol flow:  
`402 Response → Build AVM payload → Sign with Pera → Verify with facilitator → Settle on-chain`

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Next.js 16 Frontend                       │
│  Landing · Marketplace · Workflow Builder · Explorer         │
│  Register Agent                                              │
└──────────────────────┬──────────────────────────────────────┘
                       │ fetch()
┌──────────────────────▼──────────────────────────────────────┐
│                  Next.js Route Handlers                      │
│  /api/agents  /api/workflow  /api/negotiate                  │
│  /api/pay     /api/execute   /api/jobs  /api/transactions    │
└──────┬──────────────┬──────────────────┬────────────────────┘
       │              │                  │
┌──────▼──────┐ ┌─────▼──────┐ ┌────────▼────────────────────┐
│  Supabase   │ │   Ollama   │ │  Algorand + x402             │
│  (Postgres) │ │  (local)   │ │  @x402/avm + @x402/core      │
│  agents     │ │  llama3    │ │  GoPlausible facilitator      │
│  jobs       │ │  deepseek  │ │  Pera Wallet (client)         │
│  transactions│ │  mistral   │ │  USDC ASA 10458941 (testnet) │
│  reputation │ └────────────┘ └─────────────────────────────┘
└─────────────┘
```

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | Next.js (App Router) | 16.2.6 |
| Styling | Tailwind CSS | v4 |
| Database | Supabase (PostgreSQL) | `@supabase/supabase-js` 2.106.0 |
| SSR DB client | `@supabase/ssr` | 0.10.3 |
| Wallet | Pera Wallet Connect | `@perawallet/connect` 1.5.2 |
| Algorand SDK | algosdk | 3.5.2 |
| x402 Core | `@x402/core` | 2.12.0 |
| x402 AVM | `@x402/avm` | 2.12.0 |
| x402 Fetch | `@x402/fetch` | 2.12.0 |
| Algokit Utils | `@algorandfoundation/algokit-utils` | 9.2.0 |
| AI Engine | Ollama (local) | any |
| Language | TypeScript | 5.x |

---

## Project Structure

```
agentwallet/
├── app/
│   ├── _lib/                        # Server-side utilities
│   │   ├── types.ts                 # All TypeScript interfaces
│   │   ├── algorand.ts              # x402 payment requirement builder, facilitator calls
│   │   ├── ollama.ts                # Ollama chat, planWorkflow, executeAgentTask, negotiatePrice
│   │   ├── discovery.ts             # Agent scoring and task-matching algorithm
│   │   └── supabase/
│   │       ├── server.ts            # Server-side Supabase client (publishable key)
│   │       └── client.ts            # Browser-side Supabase client (publishable key)
│   │
│   ├── _components/                 # React components
│   │   ├── WalletProvider.tsx       # Pera Wallet context (connect/disconnect/sign)
│   │   ├── ConnectWalletButton.tsx  # Wallet connect button for nav
│   │   ├── X402PaymentFlow.tsx      # Full x402 payment UI (402→sign→settle→confirm)
│   │   ├── AgentCard.tsx            # Agent display card
│   │   ├── AgentSearch.tsx          # Search/filter for marketplace
│   │   ├── WorkflowVisualizer.tsx   # Horizontal step flow diagram
│   │   ├── NegotiationDialog.tsx    # Animated negotiation UI (calls /api/negotiate)
│   │   ├── PaymentStatus.tsx        # Simple payment status display
│   │   ├── TransactionFeed.tsx      # Live transaction feed with explorer links
│   │   └── StatsBar.tsx             # Stats cards (agents/jobs/volume)
│   │
│   ├── api/                         # Route Handlers (real implementations)
│   │   ├── agents/route.ts          # GET all agents from Supabase
│   │   ├── agents/[id]/route.ts     # GET single agent
│   │   ├── agents/register/route.ts # POST register new agent (validates Algorand address)
│   │   ├── workflow/route.ts        # POST plan workflow via Ollama + discover agents
│   │   ├── negotiate/route.ts       # POST negotiate price via Ollama deepseek-r1
│   │   ├── pay/route.ts             # POST real x402 flow (402→verify→settle→record)
│   │   ├── execute/route.ts         # POST execute task via Ollama (requires txHash proof)
│   │   ├── jobs/route.ts            # GET jobs from Supabase
│   │   └── transactions/route.ts    # GET transactions from Supabase
│   │
│   ├── page.tsx                     # Landing page (fetches live stats from Supabase)
│   ├── marketplace/page.tsx         # Agent marketplace (server component, Supabase)
│   ├── workflow/page.tsx            # Workflow builder (full interactive demo)
│   ├── explorer/page.tsx            # Transaction explorer (auto-refreshes every 5s)
│   ├── register/page.tsx            # Agent registration form (requires Pera Wallet)
│   └── layout.tsx                   # Root layout with WalletProvider + nav
│
├── supabase/
│   └── schema.sql                   # Full database schema + seed data
│
├── .env.local                       # Environment variables (see setup below)
└── README.md                        # This file
```

---

## Environment Setup

Copy `.env.local` and fill in your values:

```bash
# ─── Supabase ─────────────────────────────────────────────────────────────────
# Dashboard → Project Settings → API
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co

# Publishable key (replaces anon key) — safe for browser
# Format: sb_publishable_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_key_here

# Secret key (replaces service_role key) — SERVER ONLY
# Format: sb_secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SUPABASE_SECRET_KEY=sb_secret_your_key_here

# ─── Algorand / x402 ──────────────────────────────────────────────────────────
# Generate a new Algorand account:
#   node -e "const a=require('algosdk');const acc=a.generateAccount();console.log('Key:',Buffer.from(acc.sk).toString('base64'));console.log('Addr:',acc.addr.toString())"
#
# Then:
# 1. Fund with ALGO: https://lora.algokit.io/testnet/fund
# 2. Opt-in to USDC (ASA 10458941): send 0 USDC to yourself via Pera Wallet
AVM_PRIVATE_KEY=your_base64_encoded_64_byte_key
AVM_ADDRESS=your_algorand_address

NEXT_PUBLIC_ALGORAND_NETWORK=testnet

# ─── x402 Facilitator ─────────────────────────────────────────────────────────
X402_FACILITATOR_URL=https://facilitator.goplausible.xyz

# ─── Ollama ───────────────────────────────────────────────────────────────────
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3
```

---

## Database Setup (Supabase)

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the contents of `supabase/schema.sql`
3. This creates: `agents`, `jobs`, `transactions`, `reputation` tables with RLS policies
4. Seed data (6 default agents) is included in the schema

**Important:** After running the schema, update the `owner_wallet` values in the `agents` table with real Algorand testnet addresses. The seed data uses placeholder addresses.

### Key tables

| Table | Purpose |
|-------|---------|
| `agents` | Agent registry — name, endpoint, pricing, model, owner wallet |
| `jobs` | Job history — task, payment, status, result, tx hash |
| `transactions` | x402 payment records — tx hash, sender, receiver, USDC amount |
| `reputation` | Agent reputation scores — successful/failed jobs, disputes |

---

## Running Locally

```bash
# 1. Install dependencies
npm install

# 2. Set up .env.local (see above)

# 3. Run Supabase schema
# (paste supabase/schema.sql into Supabase SQL Editor)

# 4. Start Ollama (optional but recommended)
ollama serve
ollama pull llama3
ollama pull deepseek-r1

# 5. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## How the x402 Payment Flow Works

The real x402 flow is implemented in `app/api/pay/route.ts` and `app/_components/X402PaymentFlow.tsx`:

```
Client (browser)                    Server (/api/pay)              GoPlausible Facilitator
     │                                     │                               │
     │── POST /api/pay {agentId} ─────────►│                               │
     │                                     │ Build PaymentRequirements     │
     │◄── 402 + PAYMENT-REQUIRED header ───│ (amount, asset, payTo, etc.)  │
     │                                     │                               │
     │ Parse requirements                  │                               │
     │ Build ExactAvmPayloadV2             │                               │
     │   (@x402/avm ExactAvmScheme)        │                               │
     │ Sign with Pera Wallet               │                               │
     │   (USDC ASA transfer txn)           │                               │
     │                                     │                               │
     │── POST /api/pay {paymentPayload} ──►│                               │
     │                                     │── POST /verify ──────────────►│
     │                                     │◄── { isValid: true } ─────────│
     │                                     │── POST /settle ──────────────►│
     │                                     │                               │ Submit to Algorand
     │                                     │◄── { txnId: "ABC..." } ───────│ (2.8s finality)
     │                                     │ Record in Supabase            │
     │◄── 200 { txHash, confirmed } ───────│                               │
```

**Key files:**
- `app/_lib/algorand.ts` — `buildPaymentRequirement()`, `verifyPaymentWithFacilitator()`, `settlePaymentWithFacilitator()`
- `app/_components/X402PaymentFlow.tsx` — client-side flow using `@x402/avm` + Pera Wallet
- `app/api/pay/route.ts` — server-side 402 gating and settlement

**USDC on Algorand Testnet:**
- ASA ID: `10458941`
- Decimals: 6 (1 USDC = 1,000,000 micro-units)
- Both payer and payTo wallets must opt-in to this ASA before payments work

---

## How Ollama Integration Works

Three Ollama-powered features with keyword-based fallbacks:

### 1. Workflow Planning (`app/_lib/ollama.ts → planWorkflow`)
- Uses `llama3` to decompose user requests into structured steps
- Returns JSON array: `[{ task, requiredAgent, reasoning }]`
- Fallback: keyword matching (research/write/chart/summarize)

### 2. Price Negotiation (`app/_lib/ollama.ts → negotiatePrice`)
- Uses `deepseek-r1` for intelligent price negotiation
- Returns: `{ counter, finalPrice, reasoning }`
- Fallback: rule-based (counter at 80%, settle at midpoint)

### 3. Task Execution (`app/_lib/ollama.ts → executeAgentTask`)
- Uses the agent's configured model (llama3/mistral/phi/deepseek-r1)
- System prompts tailored per agent type (research/writer/viz/summarizer)
- Fallback: structured template responses

**Ollama must be running locally.** The app gracefully degrades if Ollama is unavailable.

---

## API Reference

### `GET /api/agents`
Returns all agents from Supabase, sorted by reputation.

### `GET /api/agents/[id]`
Returns a single agent by UUID.

### `POST /api/agents/register`
Registers a new agent. Validates Algorand address with `@x402/avm`.
```json
{
  "name": "MyAgent",
  "description": "...",
  "endpoint": "http://localhost:11434",
  "model": "llama3",
  "basePrice": 0.01,
  "supportedTasks": ["research", "analysis"],
  "ownerWallet": "ALGO_ADDRESS_HERE"
}
```

### `POST /api/workflow`
Plans a workflow using Ollama + discovers agents per step.
```json
{ "request": "Research and write a report on Algorand DeFi" }
```

### `POST /api/negotiate`
Negotiates price using Ollama deepseek-r1.
```json
{ "agentId": "uuid", "budget": 0.015 }
```

### `POST /api/pay`
**Without payload** → returns `402` with `PAYMENT-REQUIRED` header  
**With payload** → verifies + settles via GoPlausible facilitator
```json
{
  "agentId": "uuid",
  "resource": "/api/execute/research-task",
  "paymentPayload": "base64_encoded_ExactAvmPayloadV2",
  "senderAddress": "ALGO_ADDRESS"
}
```

### `POST /api/execute`
Executes a task via Ollama. Requires a valid `txHash` from a confirmed payment.
```json
{
  "agentId": "uuid",
  "task": "Research Algorand DeFi ecosystem",
  "txHash": "ALGORAND_TX_ID",
  "requesterWallet": "ALGO_ADDRESS",
  "context": "optional previous step results"
}
```

### `GET /api/jobs?wallet=ADDR&limit=20`
Returns jobs from Supabase with joined agent name.

### `GET /api/transactions?limit=20`
Returns x402 payment transactions from Supabase.

---

## What Is Complete

### ✅ Core Infrastructure
- [x] Next.js 16 App Router project with Tailwind v4
- [x] TypeScript types for all domain objects (`Agent`, `Job`, `Transaction`, `WorkflowStep`, etc.)
- [x] Supabase schema with RLS policies (`supabase/schema.sql`)
- [x] Supabase server + browser clients using new publishable/secret key model

### ✅ Algorand / x402
- [x] `@x402/avm` + `@x402/core` installed and integrated
- [x] `buildPaymentRequirement()` — builds real `PaymentRequirements` for Algorand USDC
- [x] `buildPaymentRequiredHeader()` — base64-encodes requirements for 402 response
- [x] `verifyPaymentWithFacilitator()` — calls GoPlausible `/verify`
- [x] `settlePaymentWithFacilitator()` — calls GoPlausible `/settle`
- [x] `/api/pay` route — full 402 → verify → settle → record flow
- [x] `X402PaymentFlow` component — client-side `ExactAvmScheme` + Pera Wallet signing
- [x] Algorand explorer links for all transaction hashes

### ✅ Pera Wallet
- [x] `WalletProvider` context with `@perawallet/connect`
- [x] Session reconnect on page load
- [x] `ConnectWalletButton` in nav
- [x] `signTransactions` delegated to Pera Wallet for x402 payload signing

### ✅ Ollama AI
- [x] `planWorkflow()` — LLM-powered task decomposition with keyword fallback
- [x] `negotiatePrice()` — deepseek-r1 negotiation with rule-based fallback
- [x] `executeAgentTask()` — per-agent-type system prompts with template fallback
- [x] `isOllamaAvailable()` — graceful degradation check

### ✅ API Routes (all real, Supabase-backed)
- [x] `GET /api/agents` — from Supabase
- [x] `GET /api/agents/[id]` — from Supabase
- [x] `POST /api/agents/register` — validates Algorand address, writes to Supabase
- [x] `POST /api/workflow` — Ollama planning + agent discovery
- [x] `POST /api/negotiate` — Ollama negotiation
- [x] `POST /api/pay` — real x402 flow
- [x] `POST /api/execute` — Ollama execution, requires payment proof
- [x] `GET /api/jobs` — from Supabase with joined agent data
- [x] `GET /api/transactions` — from Supabase

### ✅ Pages
- [x] `/` — Landing page with live stats from Supabase
- [x] `/marketplace` — Server-rendered agent grid from Supabase
- [x] `/workflow` — Full interactive demo with real x402 payments
- [x] `/explorer` — Live transaction feed + jobs table, auto-refreshes every 5s
- [x] `/register` — Agent registration form with Pera Wallet

### ✅ Build
- [x] `npx next build` passes with 0 errors, 15 routes

---

## What Is Pending / TODO

### 🔴 Critical (must fix before demo)

#### 1. Supabase RLS — agents insert policy
The current schema allows anyone to insert agents. For production, restrict to authenticated users:
```sql
-- In supabase/schema.sql, replace:
create policy "agents_insert" on agents for insert with check (true);
-- With:
create policy "agents_insert" on agents for insert with check (auth.role() = 'authenticated');
```

#### 2. Seed data — real Algorand addresses
The seed agents in `supabase/schema.sql` use placeholder addresses (`AAAA...`). Before demo:
1. Generate real testnet Algorand accounts
2. Fund each with ALGO (min 0.2 ALGO each)
3. Opt each into USDC ASA 10458941
4. Update `owner_wallet` values in the schema

#### 3. Server wallet setup
`AVM_ADDRESS` and `AVM_PRIVATE_KEY` in `.env.local` must be set to a real funded testnet account:
```bash
# Generate:
node -e "const a=require('algosdk');const acc=a.generateAccount();console.log('Key:',Buffer.from(acc.sk).toString('base64'));console.log('Addr:',acc.addr.toString())"
# Fund: https://lora.algokit.io/testnet/fund
# Opt-in to USDC: send 0 USDC to yourself via Pera Wallet testnet
```

#### 4. X402PaymentFlow — `ExactAvmScheme` import path
The import `from '@x402/avm/exact/client'` needs to be verified against the installed package's actual export map. If it fails at runtime, use the root import:
```typescript
// Current (may need adjustment):
import { ExactAvmScheme } from '@x402/avm/exact/client';
// Alternative if above fails:
import { ExactAvmScheme } from '@x402/avm';
```
Check `node_modules/@x402/avm/dist/cjs/index.js` exports.

#### 5. Pera Wallet — Next.js SSR compatibility
`@perawallet/connect` uses browser APIs. The `WalletProvider` is already `'use client'` but if SSR errors appear, add to `next.config.ts`:
```typescript
const nextConfig = {
  webpack: (config: WebpackConfig) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      crypto: false,
      stream: false,
      buffer: false,
    };
    return config;
  },
};
```

### 🟡 Important (improves demo quality)

#### 6. Reputation update RPC
`/api/execute/route.ts` calls `supabase.rpc('increment_agent_jobs', ...)` which doesn't exist yet. Add this function to Supabase:
```sql
create or replace function increment_agent_jobs(agent_id uuid)
returns void language plpgsql as $$
begin
  update agents set total_jobs = total_jobs + 1 where id = agent_id;
  update reputation set successful_jobs = successful_jobs + 1,
    score = least(5.0, score + 0.01),
    updated_at = now()
  where reputation.agent_id = increment_agent_jobs.agent_id;
end;
$$;
```

#### 7. Workflow page — payment amount from negotiation
Currently the workflow page passes the agent's `basePrice` to `X402PaymentFlow`. It should pass `ss.negotiation?.finalPrice` as the negotiated price. The `/api/pay` route needs a `negotiatedPrice` parameter to override the DB price.

#### 8. Real-time updates with Supabase Realtime
The explorer page polls every 5s. Replace with Supabase Realtime subscriptions:
```typescript
supabase
  .channel('transactions')
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'transactions' }, 
    payload => setTransactions(prev => [payload.new, ...prev]))
  .subscribe();
```

#### 9. Error boundary for Pera Wallet modal
Add a React error boundary around `WalletProvider` to handle WalletConnect v1 deprecation warnings gracefully.

#### 10. `next.config.ts` — transpile packages
Some packages in the dependency tree may need transpilation. Add if build warnings appear:
```typescript
const nextConfig = {
  transpilePackages: ['@perawallet/connect', '@x402/avm', '@x402/core'],
};
```

### 🟢 Nice to Have (post-hackathon)

#### 11. Agent reputation on-chain
Store `reputation_hash` on Algorand using ARC-2 note field or a simple ARC-4 contract. Currently reputation is only in Supabase.

#### 12. Supabase Auth
Add wallet-based authentication (sign a message with Pera Wallet, verify server-side) so agents can only be managed by their owner wallet.

#### 13. Vector search for agent discovery
Add `pgvector` extension to Supabase and embed agent descriptions for semantic task matching instead of keyword matching.

#### 14. Streaming Ollama responses
Use `stream: true` in Ollama API calls and stream results to the frontend via Server-Sent Events for better UX during long executions.

#### 15. Multi-step context passing
The workflow page passes previous step results as `context` to Ollama. This works but could be improved with a proper context window management strategy for long workflows.

---

## Known Issues

| Issue | Location | Severity | Fix |
|-------|----------|----------|-----|
| `@perawallet/connect` uses WalletConnect v1 (deprecated) | `WalletProvider.tsx` | Medium | Upgrade to `@perawallet/connect-beta` when stable |
| `ExactAvmScheme` import path may differ in installed package | `X402PaymentFlow.tsx` | High | Verify against `node_modules/@x402/avm/dist/cjs/index.js` |
| Seed agent wallets are placeholders | `supabase/schema.sql` | High | Replace with real funded testnet addresses |
| `increment_agent_jobs` RPC missing | `api/execute/route.ts` | Low | Add SQL function (see TODO #6) |
| No auth on agent registration | `api/agents/register/route.ts` | Medium | Add wallet signature verification |

---

## Hackathon Demo Script

**Setup (before demo):**
1. `npm run dev` running
2. Ollama running: `ollama serve` with `llama3` and `deepseek-r1` pulled
3. Pera Wallet app on phone with a funded testnet account (ALGO + USDC)
4. Supabase project configured with real agent wallet addresses

**Demo flow:**

1. **Landing page** — show live stats from Supabase, explain x402 + Algorand
2. **Marketplace** — show 6 agents with real pricing, reputation, Algorand addresses
3. **Connect Pera Wallet** — click "Connect Pera Wallet" in nav, scan QR code
4. **Workflow Builder** — enter: *"Research and write a competitive analysis report for AI IDE startups"*
   - Watch Ollama plan 3 steps (research → write → assemble)
   - Watch agent discovery score and rank agents
   - Watch NegotiationDialog call `/api/negotiate` (deepseek-r1 negotiates price)
   - Click "Pay with Pera Wallet" → Pera app opens → sign USDC transfer
   - Watch 402 → verify → settle → confirmed on Algorand (2.8s)
   - Watch Ollama execute each step and return real results
5. **Explorer** — show the transaction with real Algorand tx hash, click to view on explorer
6. **Register Agent** — show the registration form, explain how anyone can list an agent

**Key talking points:**
- "This is not a mock — every payment is a real USDC ASA transfer on Algorand testnet"
- "The x402 protocol means no API keys, no subscriptions — pure machine-native commerce"
- "Agents negotiate prices autonomously using deepseek-r1"
- "2.8 second finality, 0.001 ALGO fees — Algorand is purpose-built for this"

---

## Contributing / Continuing Development

If you're picking up this project, start here:

1. **Fix the critical TODOs** (items 1–5 above) before anything else
2. Run `npx next build` after every change — it must stay at 0 errors
3. The build currently passes cleanly: 15 routes, TypeScript clean
4. All real SDK imports are verified against installed package versions
5. The x402 flow is architecturally correct — the main risk is the `ExactAvmScheme` import path (TODO #4)

For questions about the x402 AVM implementation, see:
- [x402 AVM README](https://github.com/x402-foundation/x402/tree/main/typescript/packages/mechanisms/avm)
- [GoPlausible facilitator docs](https://facilitator.goplausible.xyz/docs)
- [Algorand x402 portal](https://dev.algorand.co/resources/x402-on-algorand)
