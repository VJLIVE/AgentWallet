# 🚀 Quick Start Guide

## Start Both Servers

### Terminal 1: Backend
```bash
cd backend
npm run dev
```

**Expected output:**
```
🚀 AgentWallet Backend Server Started!

📍 Server: http://localhost:3001
🌐 Environment: development
🔗 Algorand Network: https://testnet-api.algonode.cloud
📱 Smart Contract App ID: 758847371
🤖 Ollama: http://localhost:11434
[x402] Agent wallet configured: ABC123XYZ...

Ready to accept requests! 🎉
```

### Terminal 2: Frontend
```bash
cd frontend
npm run dev
```

**Expected output:**
```
▲ Next.js 16.2.3
- Local:        http://localhost:3000
- Ready in 2.3s
```

---

## ⚠️ If Backend Fails to Start

### 1. Check Agent Wallet Configuration

Edit `backend/.env` and add your agent wallet mnemonic:

```env
# x402 Automatic Payment Configuration
AGENT_WALLET_MNEMONIC=word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12 word13 word14 word15 word16 word17 word18 word19 word20 word21 word22 word23 word24 word25
```

### 2. Check Ollama is Running

```bash
# Start Ollama
ollama serve

# In another terminal, pull model
ollama pull llama3
```

### 3. Check Supabase Configuration

Verify these are set in `backend/.env`:
```env
SUPABASE_URL=https://jhgawneuhdrvmbuuhkcr.supabase.co
SUPABASE_ANON_KEY=sb_publishable_hR3WG5ONu3qFeKB3LugrpQ_JHNTJtbP
```

---

## 🧪 Test Everything Works

### 1. Test Backend Health
```bash
curl http://localhost:3001/api/health
```

### 2. Test Agent Wallet
```bash
curl http://localhost:3001/api/agent/wallet-info
```

### 3. Test Services
```bash
curl http://localhost:3001/api/agent/services
```

### 4. Open Frontend
Navigate to: http://localhost:3000/agent

---

## 🎯 Quick Demo

1. **Connect Wallet** (Pera Wallet on TestNet)
2. **Create Rule**: "Allow PDFCo payments under 1 ALGO"
3. **Execute Task**: 
   - Task: "Summarize PDF"
   - Budget: 1 ALGO
4. **Watch Magic**: Agent automatically pays 0.5 ALGO to your address!

---

## 🐛 Common Issues

### "Failed to fetch" in frontend
- **Cause**: Backend not running
- **Fix**: Start backend with `cd backend && npm run dev`

### "Agent wallet not configured"
- **Cause**: Missing `AGENT_WALLET_MNEMONIC` in `.env`
- **Fix**: Add your 25-word mnemonic to `backend/.env`

### "Ollama connection failed"
- **Cause**: Ollama not running
- **Fix**: Run `ollama serve` in separate terminal

### "Supabase error"
- **Cause**: Database not configured
- **Fix**: Check Supabase URL and key in `.env`

---

**Ready to test autonomous AI payments! 🤖💰**