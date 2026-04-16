# 🚀 x402 Automatic Payment Setup Guide

## What is x402?

**x402** is a protocol for automatic machine-to-machine payments. Your AI agent uses this to pay for services automatically without any user approval - just like how HTTP 402 "Payment Required" works, but automated!

---

## 🔧 Setup Steps

### Step 1: Create Agent Wallet

You need a separate wallet that the agent will use to make payments automatically.

#### Option A: Create New Wallet with Pera Wallet
1. Open Pera Wallet
2. Create a new account: "Add Account" → "Create Account"
3. Name it "Agent Wallet" 
4. **Copy the 25-word mnemonic** (this will be your agent's wallet)
5. **Fund it with TestNet ALGO** from [dispenser](https://bank.testnet.algorand.network/)

#### Option B: Use Existing Wallet
1. Open Pera Wallet
2. Go to Settings → Security → View Recovery Phrase
3. **Copy the 25-word mnemonic**
4. Ensure it has TestNet ALGO

---

### Step 2: Configure Backend

1. **Edit `backend/.env`**:
   ```env
   # x402 Automatic Payment Configuration
   AGENT_WALLET_MNEMONIC=word1 word2 word3 ... word25
   ```

2. **Replace with your agent wallet mnemonic**:
   ```env
   AGENT_WALLET_MNEMONIC=abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon
   ```

3. **Save the file**

---

### Step 3: Test Configuration

1. **Start backend**:
   ```bash
   cd backend
   npm run dev
   ```

2. **Check logs** - you should see:
   ```
   [x402] Agent wallet configured: ABC123XYZ...
   ```

3. **Test agent wallet balance**:
   ```bash
   curl http://localhost:3001/api/agent/wallet-info
   ```

---

## 🎯 How It Works

### Flow Diagram

```
User: "Summarize PDF under 1 ALGO"
    ↓
Agent: Plans task, selects cheapest service (0.5 ALGO)
    ↓
x402: Creates payment from agent wallet
    ↓
x402: Signs with agent's private key
    ↓
x402: Submits to Algorand TestNet
    ↓
x402: Waits for confirmation
    ↓
Result: Payment confirmed, task complete!
```

### Key Benefits

✅ **No user approval needed** - fully automatic
✅ **Instant payments** - no wallet popups
✅ **Secure** - agent wallet is separate from user wallet
✅ **Auditable** - all transactions on blockchain
✅ **Cost optimized** - agent always picks cheapest service

---

## 🔒 Security Considerations

### Agent Wallet Security
- ✅ Use a **separate wallet** for the agent (not your main wallet)
- ✅ Only fund it with **small amounts** for testing
- ✅ **Monitor spending** regularly
- ✅ **Rotate mnemonic** periodically

### Production Recommendations
1. **Environment Variables**: Store mnemonic in secure env vars
2. **Spending Limits**: Implement daily/hourly spending caps
3. **Multi-sig**: Use multi-signature wallets for large amounts
4. **Monitoring**: Set up alerts for unusual spending
5. **Backup**: Secure backup of agent wallet mnemonic

---

## 💰 Funding Your Agent Wallet

### TestNet (for testing)
1. Copy agent wallet address
2. Visit [Algorand TestNet Dispenser](https://bank.testnet.algorand.network/)
3. Paste address and request ALGO
4. Agent wallet now has funds for testing

### MainNet (for production)
1. Transfer ALGO from your main wallet to agent wallet
2. Start with small amounts (1-10 ALGO)
3. Monitor and refill as needed

---

## 🧪 Testing

### Test 1: Check Agent Wallet
```bash
# Check if agent wallet is configured
curl http://localhost:3001/api/agent/wallet-info

# Expected response:
{
  "configured": true,
  "address": "ABC123XYZ...",
  "balance": 10.0,
  "balanceInAlgo": 10.0
}
```

### Test 2: Execute Agent Task
1. Open frontend: `http://localhost:3000/agent`
2. Enter task: "Summarize PDF"
3. Set budget: 1 ALGO
4. Click "Execute Task"
5. Watch automatic payment execution!

### Test 3: Verify Transaction
1. Check logs for transaction ID
2. Visit AlgoExplorer: `https://testnet.algoexplorer.io/tx/TRANSACTION_ID`
3. Verify:
   - Sender: Agent wallet address
   - Receiver: `BV7YPBZBZEFOHTWJCHP4ITG4IZDTQYSRPHC2GOBJBQXUXQRCLGYAUSZKMQ`
   - Amount: 0.5 ALGO (cheapest service)

---

## 🐛 Troubleshooting

### Error: "Agent wallet not configured"
**Cause**: `AGENT_WALLET_MNEMONIC` not set in `.env`
**Fix**: Add your 25-word mnemonic to `backend/.env`

### Error: "Insufficient funds"
**Cause**: Agent wallet has no ALGO
**Fix**: Fund agent wallet from TestNet dispenser

### Error: "Invalid mnemonic"
**Cause**: Mnemonic format is incorrect
**Fix**: 
- Ensure exactly 25 words
- Separated by single spaces
- No extra spaces at start/end
- All lowercase

### Error: "Transaction failed"
**Cause**: Network issues or insufficient fees
**Fix**:
- Check Algorand TestNet status
- Ensure agent wallet has enough for fees (0.001 ALGO)
- Retry after a few seconds

---

## 📊 Monitoring

### Check Agent Spending
```bash
# Get recent transactions
curl "https://testnet-idx.algonode.cloud/v2/accounts/AGENT_WALLET_ADDRESS/transactions?limit=10"
```

### Track Costs
- Monitor agent wallet balance
- Set up alerts when balance is low
- Track spending patterns
- Optimize service selection

---

## 🎉 Success Indicators

Your x402 setup is working if:

✅ Backend starts without "Agent wallet not configured" error
✅ Agent wallet has TestNet ALGO balance
✅ Agent can execute tasks automatically
✅ Payments appear on AlgoExplorer
✅ No user approval popups
✅ Transaction IDs are logged
✅ Cheapest service is always selected

---

## 📈 Next Steps

### Immediate
1. ✅ Test with small amounts (0.1 ALGO)
2. ✅ Verify all transactions on AlgoExplorer
3. ✅ Monitor agent wallet balance

### Advanced
1. **Multiple Agent Wallets**: Different wallets for different services
2. **Spending Analytics**: Track agent spending over time
3. **Auto-refill**: Automatically refill agent wallet when low
4. **Service Optimization**: ML-based service selection
5. **Multi-chain**: Extend to other blockchains

---

## 🔗 Useful Links

- **TestNet Dispenser**: https://bank.testnet.algorand.network/
- **AlgoExplorer**: https://testnet.algoexplorer.io/
- **Pera Wallet**: https://perawallet.app/
- **Algorand Docs**: https://developer.algorand.org/

---

## 📞 Support

If you encounter issues:

1. Check backend logs for errors
2. Verify agent wallet has funds
3. Ensure mnemonic is correct format
4. Test with smaller amounts first
5. Check Algorand TestNet status

---

**🎊 Congratulations!** Your AI agent can now make payments automatically using x402! 🤖💰⚡
