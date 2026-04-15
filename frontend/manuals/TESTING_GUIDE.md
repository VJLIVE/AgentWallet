# 🧪 Testing Guide - Autonomous Payment Execution

## 🎯 Quick Test (5 minutes)

### Prerequisites
- ✅ Backend running on `http://localhost:3001`
- ✅ Frontend running on `http://localhost:3000`
- ✅ Pera Wallet connected to TestNet
- ✅ Wallet has at least 1 ALGO (get from [dispenser](https://bank.testnet.algorand.network/))
- ✅ Your 25-word mnemonic ready

---

## 📝 Step-by-Step Test

### Step 1: Get Your Mnemonic (1 minute)

1. Open **Pera Wallet** app or extension
2. Go to **Settings** → **Security**
3. Tap **"View Recovery Phrase"** or **"Show Seed Phrase"**
4. Enter your password/PIN
5. **Copy all 25 words** (space-separated)

Example format:
```
word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12 word13 word14 word15 word16 word17 word18 word19 word20 word21 word22 word23 word24 word25
```

⚠️ **IMPORTANT:** Never share this with anyone except for testing!

---

### Step 2: Navigate to AI Agent Console (30 seconds)

1. Open browser: `http://localhost:3000`
2. Click **"Connect Wallet"** (top right)
3. Approve connection in Pera Wallet
4. Click **"AI Agent"** in navigation menu

You should see:
- Task Description field
- Budget field
- **Wallet Mnemonic field** (new!)
- Execute Task button

---

### Step 3: Execute Autonomous Task (2 minutes)

#### Fill in the form:

**Task Description:**
```
Summarize PDF
```

**Budget (ALGO):**
```
1
```

**Wallet Mnemonic:**
```
[Paste your 25-word mnemonic here]
```

#### Click "Execute Task"

---

### Step 4: Watch the Magic ✨ (30 seconds)

You should see logs appearing in real-time:

```
✅ Task Start
   Task received: Summarize PDF
   Budget: 1.0 ALGO

🤖 Planning
   Agent planning: Selected 2 service(s) based on task requirements and budget
   
💰 Cost Calculation
   Total estimated cost: 0.8 ALGO
   
⚡ Service Selection
   Selected cheapest service: Basic PDF Parser (0.5 ALGO)
   
💸 Payment Executed
   Payment executed successfully to PDFCo
   Transaction ID: ABC123XYZ...
   Amount: 0.5 ALGO
   Receiver: BV7YPBZBZEFOHTWJCHP4ITG4IZDTQYSRPHC2GOBJBQXUXQRCLGYAUSZKMQ
```

---

### Step 5: Verify Payment (1 minute)

#### In the UI:

You should see a **green success box** with:
- ✅ "Payment Executed Successfully!"
- Transaction ID (clickable link)
- Amount: 0.5 ALGO
- Confirmed Round: [number]

#### Click the Transaction ID link

This opens AlgoExplorer. Verify:
- **Sender:** Your wallet address
- **Receiver:** `BV7YPBZBZEFOHTWJCHP4ITG4IZDTQYSRPHC2GOBJBQXUXQRCLGYAUSZKMQ`
- **Amount:** 0.5 ALGO (500,000 microALGO)
- **Status:** ✅ Confirmed
- **Type:** Payment

---

## 🎯 Expected Results

### Success Indicators

✅ **Status Badge:** Shows "executed" (green)
✅ **Payment Result Box:** Green background with checkmark
✅ **Transaction ID:** Clickable link to AlgoExplorer
✅ **Amount:** 0.5 ALGO
✅ **Receiver:** Matches `BV7YPBZBZEFOHTWJCHP4ITG4IZDTQYSRPHC2GOBJBQXUXQRCLGYAUSZKMQ`
✅ **Logs:** Show all steps from planning to execution
✅ **AlgoExplorer:** Transaction is confirmed

### What Happened Behind the Scenes

1. **Agent received task** and budget
2. **Analyzed requirements:** Needs PDF parser
3. **Found 2 services:**
   - Basic PDF Parser (0.5 ALGO) ← Selected
   - Premium PDF Parser (2.0 ALGO)
4. **Selected cheapest:** Basic PDF Parser
5. **Created transaction:**
   - From: Your wallet
   - To: `BV7YPBZBZEFOHTWJCHP4ITG4IZDTQYSRPHC2GOBJBQXUXQRCLGYAUSZKMQ`
   - Amount: 0.5 ALGO
6. **Signed with mnemonic** (your private key)
7. **Submitted to Algorand TestNet**
8. **Waited for confirmation** (4 rounds, ~4 seconds)
9. **Returned transaction ID**

---

## 🧪 Additional Test Scenarios

### Test 2: Tight Budget (Agent Optimization)

**Input:**
- Task: "Summarize PDF"
- Budget: `0.5` ALGO
- Mnemonic: [your mnemonic]

**Expected:**
- Agent selects Basic PDF Parser (0.5 ALGO)
- Payment executes successfully
- Uses entire budget

---

### Test 3: Insufficient Budget (Failure)

**Input:**
- Task: "Summarize PDF"
- Budget: `0.1` ALGO
- Mnemonic: [your mnemonic]

**Expected:**
- Agent finds no services within budget
- Task fails with error message
- No payment executed

---

### Test 4: Multiple Services (Future)

**Input:**
- Task: "Parse PDF and summarize"
- Budget: `1.5` ALGO
- Mnemonic: [your mnemonic]

**Expected:**
- Agent selects Basic PDF Parser (0.5 ALGO)
- Currently only executes one payment
- Future: Will execute multiple payments

---

## 🐛 Troubleshooting

### Issue 1: "Failed to execute autonomous payment"

**Symptoms:**
- Error message in UI
- No transaction ID
- Status shows "failed"

**Possible Causes:**
1. Insufficient ALGO balance
2. Invalid mnemonic
3. Network issues

**Solutions:**
1. Check wallet balance (need amount + 0.001 for fees)
2. Verify mnemonic is correct (25 words, space-separated)
3. Check Algorand TestNet status
4. Try again with smaller amount

---

### Issue 2: "Invalid mnemonic"

**Symptoms:**
- Error: "Invalid mnemonic" or "Failed to recover account"

**Possible Causes:**
1. Typo in mnemonic
2. Wrong number of words
3. Extra spaces

**Solutions:**
1. Copy mnemonic again from Pera Wallet
2. Ensure exactly 25 words
3. Check for extra spaces at start/end
4. Ensure words are lowercase
5. Use single space between words

---

### Issue 3: Payment not showing in logs

**Symptoms:**
- Task executes but no payment result
- Logs stop after "service selection"

**Possible Causes:**
1. Mnemonic not provided
2. Backend error

**Solutions:**
1. Ensure mnemonic field is filled
2. Check backend console for errors
3. Restart backend server
4. Check backend logs: `backend/logs/`

---

### Issue 4: Transaction not confirmed

**Symptoms:**
- Payment shows "pending"
- No confirmed round

**Possible Causes:**
1. Network congestion
2. Insufficient fees

**Solutions:**
1. Wait 10-15 seconds
2. Check AlgoExplorer for transaction status
3. Verify wallet has enough ALGO for fees

---

## 📊 Verification Checklist

After testing, verify:

- [ ] Task description was entered
- [ ] Budget was set correctly
- [ ] Mnemonic was pasted (25 words)
- [ ] "Execute Task" button was clicked
- [ ] Logs appeared in real-time
- [ ] "Planning" log showed services found
- [ ] "Service Selection" log showed cheapest service
- [ ] "Payment Executed" log appeared
- [ ] Transaction ID is displayed
- [ ] Transaction ID link works
- [ ] AlgoExplorer shows transaction
- [ ] Sender address matches your wallet
- [ ] Receiver address is `BV7YPBZBZEFOHTWJCHP4ITG4IZDTQYSRPHC2GOBJBQXUXQRCLGYAUSZKMQ`
- [ ] Amount is 0.5 ALGO (500,000 microALGO)
- [ ] Transaction status is "Confirmed"
- [ ] Green success box is displayed
- [ ] Status badge shows "executed"

---

## 🎓 Understanding the Logs

### Log Types

| Log Type | Icon | Meaning |
|----------|------|---------|
| `task_start` | ▶️ | Task execution started |
| `planning` | 🤖 | Agent analyzing requirements |
| `cost_calculation` | 💰 | Calculating total cost |
| `service_selection` | ⚡ | Selected cheapest service |
| `payment_executed` | ✅ | Payment confirmed on blockchain |
| `payment_failed` | ❌ | Payment failed |
| `error` | ⚠️ | Error occurred |

### Sample Log Sequence

```
1. task_start
   ↓
2. planning
   ↓
3. cost_calculation
   ↓
4. service_selection
   ↓
5. payment_executed ← NEW!
```

---

## 🔍 Backend Verification

### Check Backend Logs

```bash
# In backend directory
tail -f logs/app.log
```

Look for:
```
[INFO] Agent task execution: Summarize PDF
[INFO] Agent planning: Selected 2 service(s)
[INFO] Selected cheapest service: Basic PDF Parser
[INFO] Executing autonomous payment...
[INFO] Payment confirmed: txId=ABC123XYZ...
```

### Check Database Logs

```sql
-- In Supabase SQL Editor
SELECT * FROM agent_logs 
WHERE wallet_address = 'YOUR_WALLET_ADDRESS'
ORDER BY timestamp DESC
LIMIT 10;
```

Should show:
- `task_start`
- `planning`
- `cost_calculation`
- `service_selection`
- `payment_executed`

---

## 🎉 Success Criteria

Your test is successful if:

1. ✅ Agent selects cheapest service (Basic PDF Parser)
2. ✅ Payment executes automatically (no manual approval)
3. ✅ Transaction is confirmed on blockchain
4. ✅ Transaction ID is displayed with link
5. ✅ AlgoExplorer shows correct transaction details
6. ✅ Receiver address matches expected
7. ✅ Amount is correct (0.5 ALGO)
8. ✅ All logs are displayed in UI
9. ✅ Status shows "executed"
10. ✅ Green success message appears

---

## 📞 Need Help?

If tests fail:

1. **Check Prerequisites:**
   - Backend running?
   - Frontend running?
   - Wallet connected?
   - Sufficient ALGO balance?

2. **Check Logs:**
   - Backend console
   - Browser console (F12)
   - Network tab (F12 → Network)

3. **Verify Configuration:**
   - `.env` files correct?
   - Supabase connected?
   - Ollama running?

4. **Common Fixes:**
   - Restart backend
   - Restart frontend
   - Reconnect wallet
   - Clear browser cache

---

## 🚀 Next Steps After Testing

Once testing is successful:

1. **Document your findings**
2. **Test with different budgets**
3. **Test with different tasks**
4. **Monitor agent behavior**
5. **Check spending patterns**
6. **Verify all transactions on AlgoExplorer**

---

**Happy Testing! 🎊**

Your AI agent is now fully autonomous and can execute payments without manual approval!

