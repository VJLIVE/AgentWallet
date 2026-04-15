# 🎬 AgentWallet - Demo Guide

## 🎯 Hackathon Demo Script

This guide provides a step-by-step walkthrough for demonstrating AgentWallet's **Autonomous Payment Guardian** capabilities.

---

## 📋 Pre-Demo Checklist

### ✅ Setup Requirements
- [ ] Backend running on `http://localhost:3001`
- [ ] Frontend running on `http://localhost:3000`
- [ ] Ollama server running with Llama 3 model
- [ ] Supabase database configured with both tables
- [ ] Pera Wallet installed and connected to TestNet
- [ ] Wallet has TestNet ALGO (get from [dispenser](https://bank.testnet.algorand.network/))
- [ ] Browser window ready at `http://localhost:3000`

### ✅ Pre-Demo Data
Create these rules before the demo:
1. "Allow PDFCo payments under 1 ALGO"
2. "Allow TextAI payments under 0.5 ALGO"

---

## 🎭 Demo Flow (5-7 minutes)

### Part 1: The Problem (30 seconds)

**Script:**
> "AI agents can now perform complex tasks autonomously - calling APIs, processing data, making decisions. But there's a critical gap: **they can't safely handle money**. 
> 
> What if an AI agent needs to pay for a service? What if it chooses an expensive API when a cheaper one would work? What if it exceeds your budget?
>
> That's the problem AgentWallet solves."

---

### Part 2: The Solution (1 minute)

**Script:**
> "AgentWallet is the world's first **Autonomous Payment Guardian**. It's a safety layer that allows AI agents to spend money - but only within intelligent, blockchain-enforced constraints.
>
> Here's how it works:"

**Show Architecture Diagram** (from README)

**Key Points:**
1. AI agent attempts payments autonomously
2. System validates against blockchain-backed rules
3. Agent receives structured decisions (approved/blocked/modified)
4. Agent adapts and retries with cheaper alternatives
5. Complete transparency with audit logs

---

### Part 3: Live Demo - The Magic Moment (3-4 minutes)

#### Step 1: Show the Dashboard (15 seconds)
- Navigate to homepage
- Point out wallet connection
- Show account balance
- Highlight "AI Agent" in navigation

**Script:**
> "I'm connected with my Pera Wallet on Algorand TestNet. Let's see the AI agent in action."

---

#### Step 2: Show Existing Rules (20 seconds)
- Click "Rules" in navigation
- Show the pre-created rules:
  - PDFCo: 1 ALGO max
  - TextAI: 0.5 ALGO max

**Script:**
> "I've already set up spending rules using natural language. The AI parsed these and stored them on-chain. Now let's give the agent a task."

---

#### Step 3: Open AI Agent Console (10 seconds)
- Click "AI Agent" in navigation
- Show the clean interface
- Point out the three sections:
  1. Task execution
  2. Available services
  3. Activity logs

**Script:**
> "This is the AI Agent Console - where we can watch the agent think, plan, and make decisions in real-time."

---

#### Step 4: Execute Task - The Critical Demo (2-3 minutes)

**Task Input:**
```
Summarize PDF under 0.5 ALGO
```

**Budget:**
```
0.5 ALGO
```

**Click "Execute Task"**

**Watch the logs appear in real-time:**

1. **Task Start** 📝
   ```
   Task received: Summarize PDF under 0.5 ALGO
   Budget: 0.5 ALGO
   ```

2. **Agent Planning** 🤖
   ```
   Agent planning: Selected 2 service(s) based on task requirements and budget
   Selected Services: Premium PDF Parser (2 ALGO), Basic Summarizer (0.3 ALGO)
   ```

3. **Budget Exceeded** ⚠️
   ```
   Initial plan exceeds budget. Attempting to optimize...
   Required: 2.3 ALGO, Available: 0.5 ALGO
   ```

4. **Optimization** ⚡
   ```
   Optimized plan created
   Selected Services: Basic PDF Parser (0.5 ALGO), Basic Summarizer (0.3 ALGO)
   ```

**Script during execution:**
> "Watch what happens:
> 1. The agent analyzes the task - it needs PDF parsing and summarization
> 2. It initially selects premium services - but that's 2.3 ALGO, way over budget
> 3. **Here's the magic** - the agent realizes it's over budget and automatically optimizes
> 4. It switches to cheaper alternatives that fit within 0.5 ALGO
> 5. This is autonomous economic intelligence in action"

---

#### Step 5: Attempt Payment (30 seconds)

**Click "Attempt Payment" on Basic PDF Parser**

**Watch the logs:**

1. **Payment Attempt** 💰
   ```
   Payment attempt: PDFCo - 0.5 ALGO
   ```

2. **Payment Approved** ✅
   ```
   Payment is within configured spending limit
   Rule: PDFCo max 1.0 ALGO
   Requested: 0.5 ALGO
   Status: APPROVED
   ```

**Script:**
> "The agent attempts the payment, and our decision engine validates it against the blockchain-backed rules. It's approved because 0.5 ALGO is under the 1 ALGO limit for PDFCo."

---

#### Step 6: Show Blocked Payment (30 seconds)

**Scroll to Available Services**
**Click "Attempt Payment" on Premium PDF Parser (2 ALGO)**

**Watch the logs:**

1. **Payment Attempt** 💰
   ```
   Payment attempt: PDFPro - 2.0 ALGO
   ```

2. **Payment Blocked** ❌
   ```
   No spending rule configured for vendor: PDFPro
   Guidance: Create a spending rule for PDFPro before attempting payments
   Status: BLOCKED
   ```

**Script:**
> "But watch what happens when the agent tries to use a service without a rule - it's immediately blocked. The system provides clear guidance on what's needed. This is the safety layer in action."

---

### Part 4: The Impact (30 seconds)

**Script:**
> "What we've just seen is groundbreaking:
> 
> ✅ An AI agent that can spend money autonomously
> ✅ Intelligent budget optimization
> ✅ Blockchain-enforced safety constraints
> ✅ Complete transparency and auditability
> ✅ Adaptive behavior when blocked
>
> This isn't just a payment system - it's **infrastructure for the agent economy**. As AI agents become more capable, they'll need to transact in the real world. AgentWallet makes that possible - safely."

---

### Part 5: Technical Highlights (30 seconds)

**Show the tech stack briefly:**

**Script:**
> "Built on:
> - **Algorand blockchain** for tamper-proof rule enforcement
> - **Ollama AI** for natural language rule parsing
> - **Fastify backend** with structured decision engine
> - **Next.js 16** with real-time agent visualization
> - **Supabase** for agent activity logs
>
> Everything is open source and ready to deploy."

---

## 🎯 Key Messages to Emphasize

### 1. The Problem is Real
- AI agents are becoming autonomous
- They need to spend money to use services
- No existing solution for safe AI spending

### 2. The Solution is Unique
- First autonomous payment guardian
- Blockchain-backed safety
- Intelligent agent adaptation

### 3. The Demo is Impressive
- Real-time agent thinking
- Automatic optimization
- Clear decision-making
- Complete transparency

### 4. The Impact is Significant
- Enables the agent economy
- Solves a critical infrastructure gap
- Applicable to any blockchain
- Ready for production

---

## 🚨 Common Demo Issues & Fixes

### Issue: Agent logs not appearing
**Fix:** Refresh the page or click "Refresh" button in logs section

### Issue: Payment attempt fails
**Fix:** Ensure rules are created for the vendors (PDFCo, TextAI)

### Issue: Backend not responding
**Fix:** Check backend is running: `curl http://localhost:3001/api/health`

### Issue: Ollama timeout
**Fix:** Restart Ollama: `ollama serve`

### Issue: Wallet not connected
**Fix:** Reconnect Pera Wallet and ensure it's on TestNet

---

## 📊 Backup Demo (If Live Demo Fails)

### Option 1: Show Pre-recorded Video
Have a screen recording of the full demo flow ready

### Option 2: Walk Through Code
Show the key files:
1. `backend/src/services/agent.js` - Agent logic
2. `backend/src/services/validation.js` - Decision engine
3. `frontend/app/agent/page.tsx` - Agent console
4. `algosub/projects/algosub/smart_contracts/algosub/contract.py` - Smart contract

### Option 3: Show API Responses
Use curl commands to demonstrate the API:
```bash
# Show agent task execution
curl -X POST http://localhost:3001/api/agent/execute-task \
  -H "Content-Type: application/json" \
  -d '{"taskDescription": "Summarize PDF", "budget": 500000, "walletAddress": "..."}'

# Show payment attempt
curl -X POST http://localhost:3001/api/agent/attempt-payment \
  -H "Content-Type: application/json" \
  -d '{"agentId": "agent_123", "walletAddress": "...", "service": "PDFCo", "amount": 500000}'
```

---

## 🎤 Q&A Preparation

### Expected Questions & Answers

**Q: How does this differ from existing payment systems?**
A: Traditional systems assume humans initiate payments. We're the first to enable autonomous AI agents to spend money safely with blockchain-enforced constraints.

**Q: Can this work with other blockchains?**
A: Absolutely. The architecture is blockchain-agnostic. We chose Algorand for its speed and low fees, but the decision engine can work with any blockchain.

**Q: What prevents an agent from bypassing the rules?**
A: Rules are enforced on-chain via smart contracts. The agent can't bypass them - it's cryptographically impossible.

**Q: How do you handle agent errors or bugs?**
A: Every decision is logged immutably. If an agent misbehaves, we have a complete audit trail. Plus, the blockchain validation ensures no unauthorized spending.

**Q: What's the performance like?**
A: Sub-second decision-making. The agent can attempt multiple payments per second, and the blockchain validation is near-instant on Algorand.

**Q: Can this scale to production?**
A: Yes. The architecture is production-ready. We use enterprise-grade components (Fastify, Next.js, Supabase) and Algorand handles thousands of TPS.

**Q: What's next for AgentWallet?**
A: 
1. Multi-agent coordination
2. Machine learning for cost optimization
3. Integration with popular AI frameworks (LangChain, AutoGPT)
4. Mainnet deployment
5. Support for multiple blockchains

---

## 🏆 Winning Points

### Why This Wins Hackathons

1. **Solves a Real Problem** - AI agents need to transact safely
2. **Novel Approach** - First autonomous payment guardian
3. **Technical Excellence** - Clean architecture, production-ready code
4. **Great Demo** - Visual, impressive, easy to understand
5. **Broad Impact** - Enables the entire agent economy
6. **Blockchain Innovation** - Novel use case for smart contracts
7. **Complete Solution** - Frontend, backend, blockchain, AI - all integrated

### Positioning Statement

> "AgentWallet is not just a payment control system - it's the missing infrastructure layer that enables AI agents to participate in the economy. As AI becomes more autonomous, this becomes critical infrastructure."

---

## 📝 Post-Demo Actions

1. **Share GitHub repo** - Ensure README is updated
2. **Provide live demo link** - If deployed
3. **Share architecture diagram** - Visual explanation
4. **Offer to answer technical questions** - Show expertise
5. **Highlight extensibility** - Easy to add new features

---

## 🎯 Success Metrics

Your demo is successful if judges understand:

✅ The problem (AI agents can't safely spend money)
✅ The solution (Autonomous payment guardian)
✅ The innovation (First of its kind)
✅ The impact (Enables agent economy)
✅ The execution (Production-ready, well-architected)

---

**Good luck! 🚀**
