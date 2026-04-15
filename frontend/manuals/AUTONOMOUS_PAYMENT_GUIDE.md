# Autonomous Payment Execution Guide

## 🚀 What Changed

Your AgentWallet now supports **fully autonomous payment execution**! The AI agent can now:

1. ✅ **Automatically select the cheapest service** within budget
2. ✅ **Execute payments autonomously** using your wallet mnemonic
3. ✅ **No manual Pera Wallet approval needed** - fully automated
4. ✅ **Real blockchain transactions** on Algorand TestNet

---

## 🔧 Technical Changes

### 1. Service Catalog Updated
**File:** `backend/src/services/agent.js`

Added wallet addresses to all services:
- **Basic PDF Parser (PDFCo)** - 0.5 ALGO → `BV7YPBZBZEFOHTWJCHP4ITG4IZDTQYSRPHC2GOBJBQXUXQRCLGYAUSZKMQ` (your specified address)
- **Premium PDF Parser (PDFPro)** - 2.0 ALGO → Random address
- **Basic Summarizer (TextAI)** - 0.3 ALGO → Random address
- **Premium Summarizer (OpenAI)** - 1.5 ALGO → Random address

### 2. Agent Logic Enhanced
**File:** `backend/src/services/agent.js`

The agent now:
- Selects the **cheapest service** that fits within budget
- Automatically executes payment if mnemonic is provided
- Waits for blockchain confirmation
- Logs the transaction ID and confirmation

### 3. Autonomous Payment Function
**File:** `backend/src/services/algorand.js`

New function: `executeAutonomousPayment()`
- Takes sender mnemonic
- Creates payment transaction
- Signs with private key
- Submits to Algorand network
- Waits for confirmation (4 rounds)
- Returns transaction ID and details

### 4. Frontend Updates
**File:** `frontend/app/agent/page.tsx`

Added:
- Mnemonic input field (25 words)
- Security warning about mnemonic
- Payment result display with transaction link
- AlgoExplorer link to view transaction

### 5. API Updates
**File:** `frontend/lib/api.ts`

Updated `executeAgentTask()` to accept optional `signerMnemonic` parameter

---

## 🎯 How to Use

### Step 1: Get Your Wallet Mnemonic

1. Open Pera Wallet
2. Go to Settings → Security
3. View your 25-word recovery phrase
4. **⚠️ NEVER share this with anyone except the agent!**

### Step 2: Execute Autonomous Task

1. Navigate to **AI Agent Console**
2. Enter task description: `"Summarize PDF"`
3. Set budget: `1` ALGO
4. **Paste your 25-word mnemonic** in the mnemonic field
5. Click **"Execute Task"**

### Step 3: Watch the Magic ✨

The agent will:
1. Plan the task
2. Select services within budget
3. **Choose the cheapest service** (Basic PDF Parser - 0.5 ALGO)
4. **Automatically execute payment** to `BV7YPBZBZEFOHTWJCHP4ITG4IZDTQYSRPHC2GOBJBQXUXQRCLGYAUSZKMQ`
5. Wait for blockchain confirmation
6. Display transaction ID with AlgoExplorer link

---

## 📊 Example Flow

### Input:
```
Task: "Summarize PDF"
Budget: 1 ALGO
Mnemonic: "your 25 word mnemonic here..."
```

### Agent Actions:
```
1. Task Start: Received task "Summarize PDF"
2. Planning: Found 2 services (PDF Parser + Summarizer)
3. Cost Calculation: Total 0.8 ALGO
4. Service Selection: Selected Basic PDF Parser (0.5 ALGO) - cheapest option
5. Payment Execution: Sending 0.5 ALGO to BV7YPBZBZEFOHTWJCHP4ITG4IZDTQYSRPHC2GOBJBQXUXQRCLGYAUSZKMQ
6. Payment Confirmed: Transaction ID: ABC123XYZ...
7. Task Complete: Status = executed
```

### Result Display:
```
✅ Payment Executed Successfully!
Transaction ID: ABC123XYZ... (click to view on AlgoExplorer)
Amount: 0.5 ALGO
Confirmed Round: 12345678
Status: executed
```

---

## 🔒 Security Considerations

### Mnemonic Safety
- ✅ Mnemonic is sent over HTTPS
- ✅ Used only for signing transactions
- ✅ Not stored anywhere
- ⚠️ **Never commit mnemonic to git**
- ⚠️ **Never share with anyone**

### Production Recommendations
For production use, consider:
1. **Hardware wallet integration** (Ledger, Trezor)
2. **Multi-sig wallets** for agent spending
3. **Spending limits per time period**
4. **Transaction approval workflows**
5. **Encrypted mnemonic storage** with user password

---

## 🧪 Testing

### Test with Small Amounts First
1. Start with 0.1 ALGO budget
2. Verify transaction appears on AlgoExplorer
3. Check receiver address matches expected
4. Confirm amount is correct

### Test Scenarios

**Scenario 1: Within Budget**
- Task: "Summarize PDF"
- Budget: 1 ALGO
- Expected: Selects Basic PDF Parser (0.5 ALGO), executes payment

**Scenario 2: Tight Budget**
- Task: "Summarize PDF"
- Budget: 0.5 ALGO
- Expected: Selects Basic PDF Parser (0.5 ALGO), executes payment

**Scenario 3: Insufficient Budget**
- Task: "Summarize PDF"
- Budget: 0.1 ALGO
- Expected: No services available, task fails

---

## 🐛 Troubleshooting

### "Failed to execute autonomous payment"
**Cause:** Insufficient balance or invalid mnemonic
**Fix:** 
- Check wallet has enough ALGO (need amount + 0.001 for fees)
- Verify mnemonic is correct (25 words, space-separated)

### "Payment executed but not showing"
**Cause:** Blockchain confirmation delay
**Fix:** Wait 4-5 seconds, transaction should confirm

### "Invalid mnemonic"
**Cause:** Incorrect format or typo
**Fix:** 
- Ensure 25 words separated by spaces
- No extra spaces at start/end
- All lowercase

---

## 📝 API Changes

### New Request Format

**Before:**
```json
POST /api/agent/execute-task
{
  "taskDescription": "Summarize PDF",
  "budget": 1000000,
  "walletAddress": "YOUR_ADDRESS"
}
```

**After:**
```json
POST /api/agent/execute-task
{
  "taskDescription": "Summarize PDF",
  "budget": 1000000,
  "walletAddress": "YOUR_ADDRESS",
  "signerMnemonic": "word1 word2 word3 ... word25"
}
```

### New Response Format

**Before:**
```json
{
  "agentId": "agent_123",
  "status": "planned",
  "plan": {...},
  "logs": [...]
}
```

**After:**
```json
{
  "agentId": "agent_123",
  "status": "executed",
  "plan": {...},
  "selectedService": {
    "id": "pdf-parser-cheap",
    "name": "Basic PDF Parser",
    "vendor": "PDFCo",
    "cost": 500000,
    "walletAddress": "BV7YPBZBZEFOHTWJCHP4ITG4IZDTQYSRPHC2GOBJBQXUXQRCLGYAUSZKMQ"
  },
  "paymentResult": {
    "txId": "ABC123XYZ...",
    "confirmedRound": 12345678,
    "from": "YOUR_ADDRESS",
    "to": "BV7YPBZBZEFOHTWJCHP4ITG4IZDTQYSRPHC2GOBJBQXUXQRCLGYAUSZKMQ",
    "amount": 500000,
    "amountInAlgo": 0.5,
    "status": "confirmed",
    "message": "Payment executed and confirmed successfully"
  },
  "logs": [...]
}
```

---

## 🎉 Benefits

### For Users
- ✅ **Fully autonomous** - no manual approvals
- ✅ **Cost optimized** - always picks cheapest option
- ✅ **Transparent** - see every decision
- ✅ **Verifiable** - blockchain proof of payment

### For Developers
- ✅ **Simple integration** - just pass mnemonic
- ✅ **Reliable** - waits for confirmation
- ✅ **Extensible** - easy to add more services
- ✅ **Production-ready** - error handling included

---

## 🚀 Next Steps

### Immediate
1. Test with your wallet mnemonic
2. Verify payments on AlgoExplorer
3. Check logs for transparency

### Future Enhancements
1. **Multi-service execution** - pay for multiple services in one task
2. **Batch payments** - group multiple payments
3. **Payment scheduling** - delayed execution
4. **Refund logic** - if service fails
5. **Payment receipts** - generate invoices

---

## 📞 Support

If you encounter issues:
1. Check backend logs for errors
2. Verify mnemonic is correct
3. Ensure sufficient ALGO balance
4. Check Algorand TestNet status
5. Review transaction on AlgoExplorer

---

**🎊 Congratulations!** Your AI agent can now spend money autonomously - safely and transparently! 🤖💰

