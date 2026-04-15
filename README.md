# AgentWallet | Autonomous Payment Guardian 🤖

<div align="center">

<img src="./frontend/public/agentwallet-logo.svg" alt="AgentWallet Logo" width="200" height="200" />

![AgentWallet](https://img.shields.io/badge/AgentWallet-Autonomous%20Payment%20Guardian-2563eb?style=for-the-badge&logo=shield&logoColor=white)

**The Safety Layer That Allows AI Agents to Transact in the Real World**

[![Algorand](https://img.shields.io/badge/Algorand-TestNet-00D1B2?style=flat-square&logo=algorand&logoColor=white)](https://testnet.algoexplorer.io/application/758847371)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js&logoColor=white)](https://nextjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](LICENSE)

[Live Demo](#) • [Documentation](#documentation) • [Report Bug](#) • [Request Feature](#)

</div>

---

## 🎯 Overview

**AgentWallet** is the world's first **Autonomous Payment Guardian** for AI agents. It enables AI agents to spend money autonomously while enforcing intelligent, blockchain-backed spending constraints.

### 🔥 The Problem

AI agents are becoming capable of performing tasks autonomously (calling APIs, using tools, executing workflows), but:
- ❌ They cannot safely handle money
- ❌ There is no control layer for AI spending
- ❌ Existing systems assume humans initiate payments

### 💡 The Solution

AgentWallet transforms into a **payment guard layer** for autonomous AI agents. Instead of users manually making payments, AI agents attempt to spend, and the system:
- ✅ Validates spending against rules
- ✅ Blocks unsafe transactions
- ✅ Guides the agent toward acceptable alternatives

### 🏆 One-Line Pitch

> **"We built a system where AI agents can spend money autonomously — but never overspend."**

---

## 🚀 Key Features

### 🤖 Autonomous AI Agent
- Task-executing agent with Ollama integration
- Breaks user tasks into steps
- Selects appropriate services/APIs
- Attempts payments automatically

### 🛡️ Intelligent Decision Engine
- Real-time payment validation
- Structured decision responses (approved/blocked/modified)
- Adaptive agent behavior based on rejections
- Transparent reasoning for every decision

### 💸 Payment Attempt API
- AI agents request payments programmatically
- System validates against blockchain-backed rules
- Returns actionable guidance for blocked payments
- Complete audit trail of all attempts

### 📊 AI Agent Console
- Live agent thinking visualization
- Real-time payment attempt tracking
- Transparent decision-making logs
- Service catalog and cost optimization

### 🔒 Blockchain Security
- On-chain rule validation with Algorand smart contracts
- Tamper-proof spending limits
- Cryptographic transaction signing
- Immutable audit trail

---

## 🧩 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     USER INTERFACE                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Dashboard   │  │  Rules Mgmt  │  │ AI Agent     │     │
│  │              │  │              │  │ Console      │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   AI AGENT LAYER (NEW)                      │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Task Planning → Service Selection → Payment Attempt │  │
│  │  ↓ Blocked? → Optimize → Retry with Cheaper Service │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              DECISION ENGINE (CORE LOGIC)                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Check Rules → Return Decision (approved/blocked)    │  │
│  │  Provide Guidance → Suggest Alternatives             │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                 BLOCKCHAIN VALIDATION                       │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Algorand Smart Contract (App ID: 758847371)        │  │
│  │  Methods: opt_in, set_rule, validate_payment        │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎬 Demo Scenario (MANDATORY FOR HACKATHON)

### Scenario: "Summarize PDF under 0.5 ALGO"

**Step 1: User Input**
```
User: "Summarize this PDF under 0.5 ALGO"
```

**Step 2: Agent Planning**
```
Agent: Analyzing task...
Agent: Need: PDF parser API + LLM API
Agent: Selecting services...
```

**Step 3: First Payment Attempt (❌ BLOCKED)**
```
Agent: Attempting payment to PDFPro (2 ALGO)
System: ❌ BLOCKED - Amount exceeds budget (0.5 ALGO)
System: Guidance: Choose cheaper service alternative
```

**Step 4: Agent Adapts**
```
Agent: Optimizing plan...
Agent: Switching to PDFCo (0.5 ALGO)
```

**Step 5: Second Payment Attempt (✅ APPROVED)**
```
Agent: Attempting payment to PDFCo (0.5 ALGO)
System: ✅ APPROVED - Payment within budget
Agent: Executing task...
Agent: Task completed successfully!
```

**Result**: AI agent successfully completed the task within budget by adapting to payment constraints.

---

## 🚀 Quick Start

> **📖 Detailed Setup Guide:** For step-by-step instructions with troubleshooting, see [SETUP_INSTRUCTIONS.md](./SETUP_INSTRUCTIONS.md)

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **Ollama** ([Download](https://ollama.ai/))
- **Pera Wallet** ([Download](https://perawallet.app/))
- **Supabase Account** ([Sign up](https://supabase.com/))

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd algosub
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Set up Ollama**
   ```bash
   # Pull the Llama 3 model
   ollama pull llama3
   
   # Start Ollama server (keep running in background)
   ollama serve
   ```

5. **Configure Supabase**
   
   Create a new Supabase project and run the SQL from `backend/schema/supabase-setup.sql`:
   
   ```sql
   -- Creates both 'rules' and 'agent_logs' tables
   -- See backend/schema/supabase-setup.sql for full schema
   ```

6. **Configure environment variables**

   **Backend** (`backend/.env`):
   ```env
   # Algorand Network
   ALGOD_SERVER=https://testnet-api.algonode.cloud
   ALGOD_TOKEN=
   ALGOSUB_APP_ID=758847371

   # Ollama Configuration
   OLLAMA_BASE_URL=http://localhost:11434
   OLLAMA_MODEL=llama3

   # Supabase Configuration
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key

   # Server Configuration
   PORT=3001
   FRONTEND_URL=http://localhost:3000
   ```

   **Frontend** (`frontend/.env.local`):
   ```env
   NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
   NEXT_PUBLIC_ALGOD_SERVER=https://testnet-api.algonode.cloud
   NEXT_PUBLIC_ALGOSUB_APP_ID=758847371
   ```

7. **Start the application**

   ```bash
   # Terminal 1: Start backend
   cd backend
   npm run dev

   # Terminal 2: Start frontend
   cd frontend
   npm run dev
   ```

8. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

---

## 🤖 Using the AI Agent

### Quick Start with AI Agent

1. **Connect Your Wallet** - Click "Connect Wallet" and approve with Pera Wallet

2. **Create Spending Rules** - Navigate to Rules page and create rules like:
   ```
   Allow PDFCo payments under 1 ALGO
   Allow TextAI payments under 0.5 ALGO
   ```

3. **Open AI Agent Console** - Click "AI Agent" in navigation

4. **Execute a Task**:
   - Enter task: "Summarize PDF under 1 ALGO"
   - Set budget: 1 ALGO
   - Click "Execute Task"

5. **Watch the Magic** ✨:
   - Agent plans the task
   - Selects appropriate services
   - Attempts payments
   - Adapts if blocked
   - Completes within budget

### AI Agent Features

#### 🎯 Task Planning
The agent analyzes your task description and automatically:
- Identifies required services (PDF parsing, summarization, etc.)
- Selects appropriate service tiers based on budget
- Creates an execution plan

#### 💰 Budget Awareness
The agent respects your budget by:
- Calculating total cost before execution
- Choosing cheaper alternatives when needed
- Never exceeding specified limits

#### 🔄 Adaptive Behavior
When payments are blocked, the agent:
- Analyzes the rejection reason
- Finds cheaper service alternatives
- Retries with optimized plan
- Learns from constraints

#### 📊 Transparent Logging
Every agent action is logged:
- Task planning decisions
- Service selections
- Payment attempts
- Approval/rejection reasons
- Optimization steps

### Available Services

The demo includes 4 hardcoded services:

| Service | Vendor | Cost | Description |
|---------|--------|------|-------------|
| Basic PDF Parser | PDFCo | 0.5 ALGO | Basic PDF text extraction |
| Premium PDF Parser | PDFPro | 2.0 ALGO | Advanced PDF parsing with OCR |
| Basic Summarizer | TextAI | 0.3 ALGO | Simple text summarization |
| Premium Summarizer | OpenAI | 1.5 ALGO | Advanced AI summarization |

---

## 📖 Usage Guide

### 1. Get TestNet ALGO

1. Install Pera Wallet on your mobile device or browser
2. Switch to **TestNet** mode in settings
3. Copy your wallet address
4. Visit [Algorand TestNet Dispenser](https://bank.testnet.algorand.network/)
5. Paste your address and request TestNet ALGO

### 2. Connect Your Wallet

1. Click **"Connect Wallet"** in the navigation bar
2. Scan the QR code with Pera Wallet app (or approve in browser extension)
3. Your wallet is now connected

### 3. Create a Spending Rule

1. Navigate to the **Rules** page
2. Enter a rule in natural language:
   ```
   Allow Swiggy payments under 300 ALGO
   ```
3. Click **"Parse Rule with AI"**
4. Review the parsed rule
5. Click **"Save Rule"**

### 4. Make a Payment

1. Navigate to the **Payments** page
2. Fill in the payment details:
   - **Vendor Name**: Must match your rule (e.g., "Swiggy")
   - **Receiver Address**: Valid 58-character Algorand address
   - **Amount**: Amount in ALGO (e.g., "250")
3. Click **"Send Payment"**
4. The system will:
   - Validate against your rules
   - Create the transaction
   - Prompt you to sign in Pera Wallet
   - Submit to Algorand TestNet
   - Show confirmation with transaction ID

### Example Scenarios

#### ✅ Valid Payment
- **Rule**: "Allow Swiggy payments under 300 ALGO"
- **Payment**: 250 ALGO to Swiggy
- **Result**: Payment succeeds

#### ❌ Blocked Payment (Exceeds Limit)
- **Rule**: "Allow Swiggy payments under 300 ALGO"
- **Payment**: 350 ALGO to Swiggy
- **Result**: Payment blocked - "You're trying to send 350 ALGO to Swiggy, but your limit is 300 ALGO. You're over by 50 ALGO."

#### ❌ Blocked Payment (No Rule)
- **Payment**: 100 ALGO to Amazon (no rule exists)
- **Result**: Payment blocked - "No rule found for vendor: Amazon"

---

## 🛠️ Tech Stack

### Smart Contract
- **Language**: Algorand Python (PuyaPy)
- **Network**: Algorand TestNet
- **App ID**: 758847371
- **Methods**: `opt_in()`, `set_rule()`, `validate_payment()`

### Backend
- **Framework**: Fastify
- **Runtime**: Node.js 18+
- **AI**: Ollama (Llama 3)
- **Database**: Supabase (PostgreSQL)
- **Blockchain SDK**: algosdk v3

### Frontend
- **Framework**: Next.js 16 (App Router)
- **UI Library**: React 19
- **Styling**: Tailwind CSS
- **Wallet**: Pera Wallet Connect
- **Icons**: Lucide React
- **Notifications**: react-hot-toast

---

## 📁 Project Structure

```
algosub/
├── algosub/                    # Smart contract project
│   └── projects/algosub/
│       └── smart_contracts/    # Algorand Python contracts
│           └── algosub/
│               ├── contract.py         # Main smart contract
│               └── deploy_config.py    # Deployment configuration
│
├── backend/                    # Backend API
│   ├── src/
│   │   ├── index.js           # Main server file
│   │   ├── routes/            # API endpoints
│   │   └── services/          # Business logic
│   │       ├── algorand.js    # Algorand integration
│   │       ├── ollama.js      # AI rule parsing
│   │       ├── supabase.js    # Database operations
│   │       └── validation.js  # Payment validation
│   ├── .env                   # Environment variables
│   └── package.json
│
├── frontend/                   # Frontend application
│   ├── app/                   # Next.js app directory
│   │   ├── layout.tsx         # Root layout
│   │   ├── page.tsx           # Dashboard page
│   │   ├── rules/             # Rules management page
│   │   └── payments/          # Payments page
│   ├── components/            # React components
│   │   ├── Navigation.tsx     # Navigation bar
│   │   ├── WalletButton.tsx   # Wallet connection
│   │   ├── RuleCreator.tsx    # Rule creation form
│   │   ├── RulesList.tsx      # Rules display
│   │   └── PaymentForm.tsx    # Payment execution
│   ├── contexts/              # React contexts
│   │   └── WalletContext.tsx  # Wallet state management
│   ├── lib/                   # Utilities
│   │   ├── algorand.ts        # Algorand utilities
│   │   └── api.ts             # Backend API client
│   ├── .env.local             # Environment variables
│   └── package.json
│
└── README.md                  # This file
```

---

## 🔗 API Endpoints

### Backend API

#### Rule Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/parse-rule` | Parse natural language rule with AI |
| `POST` | `/api/rules` | Save a new spending rule |
| `GET` | `/api/rules/:address` | Get all rules for a wallet |
| `POST` | `/api/validate-payment` | Validate payment against rules |

#### AI Agent Endpoints (NEW)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/agent/execute-task` | Execute autonomous agent task |
| `POST` | `/api/agent/attempt-payment` | Agent attempts payment (returns decision) |
| `GET` | `/api/agent/logs/:walletAddress` | Get agent execution logs |
| `GET` | `/api/agent/services` | Get available service catalog |
| `GET` | `/api/agent/services/:serviceId` | Get specific service details |

#### System
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Health check endpoint |
| `GET` | `/` | API information and endpoints list |

### Example API Calls

**Execute Agent Task:**
```bash
curl -X POST http://localhost:3001/api/agent/execute-task \
  -H "Content-Type: application/json" \
  -d '{
    "taskDescription": "Summarize PDF under 1 ALGO",
    "budget": 1000000,
    "walletAddress": "YOUR_WALLET_ADDRESS"
  }'
```

**Agent Payment Attempt:**
```bash
curl -X POST http://localhost:3001/api/agent/attempt-payment \
  -H "Content-Type: application/json" \
  -d '{
    "agentId": "agent_123",
    "walletAddress": "YOUR_WALLET_ADDRESS",
    "service": "PDFCo",
    "amount": 500000,
    "metadata": {
      "task": "PDF parsing"
    }
  }'
```

**Response (Approved):**
```json
{
  "success": true,
  "decision": {
    "status": "approved",
    "reason": "Payment is within configured spending limit",
    "allowedAmount": 500000,
    "requestedAmount": 500000,
    "requestedAmountInAlgo": 0.5,
    "rule": {
      "vendor": "PDFCo",
      "maxAmount": 1000000,
      "maxAmountInAlgo": 1.0
    }
  }
}
```

**Response (Blocked):**
```json
{
  "success": true,
  "decision": {
    "status": "blocked",
    "reason": "No spending rule configured for vendor: PDFPro",
    "allowedAmount": 0,
    "requestedAmount": 2000000,
    "requestedAmountInAlgo": 2.0,
    "guidance": "Create a spending rule for PDFPro before attempting payments"
  }
}
```

**Response (Modified):**
```json
{
  "success": true,
  "decision": {
    "status": "modified",
    "reason": "Requested amount exceeds limit. Maximum allowed: 1.0 ALGO",
    "allowedAmount": 1000000,
    "allowedAmountInAlgo": 1.0,
    "requestedAmount": 2000000,
    "requestedAmountInAlgo": 2.0,
    "difference": 1000000,
    "differenceInAlgo": 1.0,
    "guidance": "Reduce payment amount or choose a cheaper service alternative"
  }
}
```

**Get Agent Logs:**
```bash
curl http://localhost:3001/api/agent/logs/YOUR_WALLET_ADDRESS?limit=50
```

**Parse Rule:**
```bash
curl -X POST http://localhost:3001/api/parse-rule \
  -H "Content-Type: application/json" \
  -d '{"input": "Allow Swiggy payments under 300 ALGO"}'
```

**Validate Payment:**
```bash
curl -X POST http://localhost:3001/api/validate-payment \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress": "YOUR_WALLET_ADDRESS",
    "vendor": "Swiggy",
    "amount": 250000000
  }'
```

---

## 🎨 UI Design

The frontend features an enterprise-grade design system with:

- **Professional Color Palette**: Neutral grays with blue accents
- **Consistent Components**: Reusable card, button, and input styles
- **Smooth Animations**: Subtle transitions and hover effects
- **Responsive Layout**: Mobile-first design that works on all devices
- **Accessible**: Proper contrast ratios and semantic HTML

### Design Tokens

```css
Primary: #2563eb (Blue 600)
Neutral: #171717 to #fafafa (Gray scale)
Success: #16a34a (Green 600)
Warning: #f59e0b (Amber 500)
Error: #ef4444 (Red 500)
```

---

## 🐛 Troubleshooting

### Backend Issues

**Ollama not responding**
```bash
# Start Ollama server
ollama serve

# Verify it's running
curl http://localhost:11434/api/tags
```

**Supabase connection error**
- Check your `SUPABASE_URL` and `SUPABASE_ANON_KEY` in `backend/.env`
- Verify the database table exists
- Check RLS policies are configured

### Frontend Issues

**Wallet won't connect**
- Ensure Pera Wallet is on TestNet mode
- Try refreshing the page
- Check browser console for errors

**Rules not loading**
- Verify backend is running on port 3001
- Check browser console for API errors
- Ensure wallet is connected

### Payment Issues

**Insufficient funds**
- Get more TestNet ALGO from the [dispenser](https://bank.testnet.algorand.network/)

**Payment blocked**
- Verify a rule exists for the vendor
- Check the amount doesn't exceed the rule limit
- Ensure vendor name matches exactly (case-sensitive)

**Transaction fails**
- Check you have enough ALGO for transaction fees (~0.001 ALGO)
- Verify the receiver address is valid
- Check Algorand TestNet status

---

## 🔐 Security Considerations

- **Smart Contract**: All rules are enforced on-chain, ensuring tamper-proof validation
- **Private Keys**: Never stored or transmitted - managed by Pera Wallet
- **API Security**: CORS configured to only allow frontend origin
- **Database**: Row-level security enabled on Supabase
- **TestNet Only**: This demo uses TestNet ALGO with no real value

---

## 🚧 Development

### Running Tests

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

### Building for Production

```bash
# Build backend
cd backend
npm run build

# Build frontend
cd frontend
npm run build
npm start
```

### Environment Variables

See `.env.example` files in `backend/` and `frontend/` directories for all available configuration options.

---

## 📊 Project Status

### Core Features
| Feature | Status |
|---------|--------|
| Smart Contract Deployment | ✅ Complete |
| Backend API | ✅ Complete |
| Frontend UI | ✅ Complete |
| Wallet Integration | ✅ Complete |
| AI Rule Parsing | ✅ Complete |
| Payment Validation | ✅ Complete |
| Rule Management | ✅ Complete |
| Enterprise UI Design | ✅ Complete |

### AI Agent Features (NEW)
| Feature | Status |
|---------|--------|
| Autonomous Agent Service | ✅ Complete |
| Task Planning Engine | ✅ Complete |
| Payment Attempt API | ✅ Complete |
| Decision Engine (Structured Responses) | ✅ Complete |
| Agent Logs Storage | ✅ Complete |
| AI Agent Console UI | ✅ Complete |
| Real-time Activity Visualization | ✅ Complete |
| Service Catalog | ✅ Complete |
| Adaptive Retry Logic | ✅ Complete |
| Budget Optimization | ✅ Complete |

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Algorand Foundation** - Blockchain platform and development tools
- **AlgoKit** - Smart contract development framework
- **Ollama** - Local AI inference engine
- **Pera Wallet** - Wallet integration and transaction signing
- **Supabase** - Database and backend services
- **Vercel** - Next.js framework and hosting

---

## 📧 Support

For questions, issues, or feedback:

- 📫 Open an issue on GitHub
- 💬 Join our community discussions
- 📖 Check the documentation

---

## 🔗 Links

- **Smart Contract**: [AlgoExplorer](https://testnet.algoexplorer.io/application/758847371)
- **TestNet Dispenser**: [Get TestNet ALGO](https://bank.testnet.algorand.network/)
- **Pera Wallet**: [Download](https://perawallet.app/)
- **Ollama**: [Install](https://ollama.ai/)
- **Algorand Docs**: [Developer Portal](https://developer.algorand.org/)

---

<div align="center">

**Built with ❤️ on Algorand**

⭐ Star this repo if you find it useful!

</div>
