# AgentWallet - Setup Instructions

## 🚀 Quick Setup Guide

Follow these steps to get AgentWallet running on your local machine.

---

## 📋 Prerequisites

Before you begin, make sure you have:

- ✅ **Node.js 18+** installed ([Download](https://nodejs.org/))
- ✅ **Ollama** installed and running ([Download](https://ollama.ai/))
- ✅ **Pera Wallet** (mobile app or browser extension) ([Download](https://perawallet.app/))
- ✅ **Supabase account** ([Sign up](https://supabase.com/))
- ✅ **Git** installed

---

## 🗄️ Database Setup (IMPORTANT!)

### Step 1: Create Supabase Project

1. Go to [Supabase](https://supabase.com/)
2. Click "New Project"
3. Fill in project details:
   - **Name**: AgentWallet (or your choice)
   - **Database Password**: Choose a strong password
   - **Region**: Select closest to you
4. Click "Create new project" and wait for setup to complete

### Step 2: Run Database Schema

1. In your Supabase project, go to **SQL Editor** (left sidebar)
2. Click **"New Query"**
3. Copy the entire contents of `backend/schema/supabase-setup.sql`
4. Paste into the SQL editor
5. Click **"Run"** or press `Ctrl+Enter`

**Expected Output:**
```
Success. No rows returned
```

### Step 3: Verify Tables Created

1. Go to **Table Editor** (left sidebar)
2. You should see two tables:
   - ✅ `rules` - Stores spending rules
   - ✅ `agent_logs` - Stores AI agent activity

If you don't see these tables, re-run the SQL script.

### Step 4: Get API Credentials

1. Go to **Project Settings** → **API**
2. Copy these values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon public** key (long string starting with `eyJ...`)

---

## ⚙️ Backend Setup

### Step 1: Install Dependencies

```bash
cd backend
npm install
```

### Step 2: Configure Environment

1. Copy the example env file:
   ```bash
   cp .env.example .env
   ```

2. Edit `backend/.env` with your values:

```env
# Algorand Network (TestNet)
ALGOD_SERVER=https://testnet-api.algonode.cloud
ALGOD_TOKEN=
ALGOSUB_APP_ID=758847371

# Ollama Configuration
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3

# Supabase Configuration (REPLACE WITH YOUR VALUES)
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Server Configuration
PORT=3001
HOST=0.0.0.0
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
LOG_LEVEL=info
```

### Step 3: Start Ollama

```bash
# Pull the Llama 3 model (first time only)
ollama pull llama3

# Start Ollama server (keep this running)
ollama serve
```

**Verify Ollama is running:**
```bash
curl http://localhost:11434/api/tags
```

You should see a JSON response with available models.

### Step 4: Start Backend Server

```bash
npm run dev
```

**Expected Output:**
```
🚀 AgentWallet Backend Server Started!

📍 Server: http://localhost:3001
🌐 Environment: development
🔗 Algorand Network: https://testnet-api.algonode.cloud
📱 Smart Contract App ID: 758847371
🤖 Ollama: http://localhost:11434

Ready to accept requests! 🎉
```

**Test the backend:**
```bash
curl http://localhost:3001/api/health
```

---

## 🎨 Frontend Setup

### Step 1: Install Dependencies

```bash
cd frontend
npm install
```

### Step 2: Configure Environment

1. Copy the example env file:
   ```bash
   cp .env.local.example .env.local
   ```

2. Edit `frontend/.env.local`:

```env
# Backend API URL
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001

# Algorand Configuration
NEXT_PUBLIC_ALGOD_SERVER=https://testnet-api.algonode.cloud
NEXT_PUBLIC_ALGOSUB_APP_ID=758847371
```

### Step 3: Start Frontend

```bash
npm run dev
```

**Expected Output:**
```
▲ Next.js 16.2.3
- Local:        http://localhost:3000
- Ready in 2.3s
```

---

## 💰 Wallet Setup

### Step 1: Install Pera Wallet

**Mobile:**
- Download from [App Store](https://apps.apple.com/app/pera-algo-wallet/id1459898525) or [Google Play](https://play.google.com/store/apps/details?id=com.algorand.android)

**Browser Extension:**
- Install from [Chrome Web Store](https://chrome.google.com/webstore/detail/pera-wallet/kfmkakjlffkpaihbhcmhijkddfjjkbkb)

### Step 2: Switch to TestNet

1. Open Pera Wallet
2. Go to **Settings** → **Developer Settings**
3. Enable **TestNet Mode**
4. Create or import a wallet

### Step 3: Get TestNet ALGO

1. Copy your wallet address from Pera Wallet
2. Go to [Algorand TestNet Dispenser](https://bank.testnet.algorand.network/)
3. Paste your address
4. Click **"Dispense"**
5. Wait for confirmation (you'll receive 10 TestNet ALGO)

**Verify balance:**
- Check Pera Wallet - you should see ~10 ALGO

---

## ✅ Verification Checklist

Before using AgentWallet, verify everything is working:

### Backend Checks

```bash
# 1. Health check
curl http://localhost:3001/api/health

# Expected: {"status":"healthy",...}

# 2. Check services
curl http://localhost:3001/api/agent/services

# Expected: {"success":true,"services":[...],"count":4}

# 3. Test Ollama integration
curl -X POST http://localhost:3001/api/parse-rule \
  -H "Content-Type: application/json" \
  -d '{"input":"Allow Swiggy payments under 100 ALGO"}'

# Expected: {"success":true,"rule":{...}}
```

### Frontend Checks

1. Open http://localhost:3000
2. You should see the AgentWallet homepage
3. Click **"Connect Wallet"**
4. Scan QR code with Pera Wallet (or approve in browser extension)
5. You should see your wallet address in the navigation

### Database Checks

1. Go to Supabase → **Table Editor**
2. Click on `rules` table
3. Should show empty table (no errors)
4. Click on `agent_logs` table
5. Should show empty table (no errors)

---

## 🎯 First Use

### 1. Create Your First Rule

1. Navigate to **Rules** page
2. Enter a rule in natural language:
   ```
   Allow PDFCo payments under 1 ALGO
   ```
3. Click **"Parse Rule with AI"**
4. Review the parsed rule
5. Click **"Save Rule"**
6. You should see the rule appear in the list

### 2. Execute Your First Agent Task

1. Navigate to **AI Agent** page
2. Enter a task:
   ```
   Summarize PDF under 1 ALGO
   ```
3. Set budget: `1` ALGO
4. Click **"Execute Task"**
5. Watch the agent plan and optimize
6. See logs appear in real-time

---

## 🐛 Troubleshooting

### "Cannot connect to Supabase"

**Problem:** Backend can't reach Supabase database

**Solutions:**
1. Check `SUPABASE_URL` and `SUPABASE_ANON_KEY` in `backend/.env`
2. Verify Supabase project is active (not paused)
3. Check internet connection
4. Verify API keys are correct (no extra spaces)

### "Table 'rules' does not exist"

**Problem:** Database schema not created

**Solutions:**
1. Go to Supabase SQL Editor
2. Run `backend/schema/supabase-setup.sql`
3. Verify tables appear in Table Editor
4. Refresh the frontend

### "Ollama connection failed"

**Problem:** Ollama server not running

**Solutions:**
1. Start Ollama: `ollama serve`
2. Verify it's running: `curl http://localhost:11434/api/tags`
3. Check `OLLAMA_BASE_URL` in `backend/.env`
4. Ensure Llama 3 model is pulled: `ollama pull llama3`

### "Wallet won't connect"

**Problem:** Pera Wallet connection issues

**Solutions:**
1. Ensure Pera Wallet is on **TestNet mode**
2. Try refreshing the page
3. Clear browser cache
4. Try different browser
5. Check browser console for errors

### "No rules or logs showing"

**Problem:** Empty database or fetch error

**Solutions:**
1. Check browser console for errors
2. Verify backend is running: `curl http://localhost:3001/api/health`
3. Check Supabase tables exist
4. Try creating a rule manually
5. Check backend logs for errors

### "Agent task fails"

**Problem:** Agent execution error

**Solutions:**
1. Ensure you have rules created for the services
2. Check budget is sufficient
3. Verify Ollama is running
4. Check backend logs
5. Try a simpler task first

---

## 📚 Additional Resources

- **Main README**: [README.md](./README.md)
- **Demo Guide**: [DEMO_GUIDE.md](./DEMO_GUIDE.md)
- **API Reference**: [backend/API_REFERENCE.md](./backend/API_REFERENCE.md)
- **Project Summary**: [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md)

---

## 🆘 Getting Help

If you're still having issues:

1. Check the [Troubleshooting](#-troubleshooting) section above
2. Review backend logs for errors
3. Check browser console for frontend errors
4. Verify all prerequisites are installed
5. Try restarting all services

---

## ✨ You're Ready!

Once everything is set up, you can:

- ✅ Create spending rules with natural language
- ✅ Execute autonomous agent tasks
- ✅ Watch AI agents make payment decisions
- ✅ See real-time activity logs
- ✅ Validate payments against blockchain rules

**Enjoy using AgentWallet! 🚀**
