# Credit System Setup Guide

## ✅ Deployment Complete

Your credit system smart contract is now deployed on Algorand Testnet (Lora):

**App ID:** `762919965`

## 📋 Configuration Checklist

### 1. Environment Variables

Update your `.env.local` file with:

```env
# Credit System Smart Contract
NEXT_PUBLIC_CREDIT_CONTRACT_ID=762919965

# Admin mnemonic (same account that deployed the contract)
ADMIN_MNEMONIC=your 25 word mnemonic phrase here
```

⚠️ **Important:** Replace `your 25 word mnemonic phrase here` with the actual mnemonic of the account that deployed the contract (App ID 762919965).

### 2. Files Created

✅ **Smart Contract:**
- `contracts/credit_system.py` - PuyaPy smart contract (deployed)

✅ **Frontend Integration:**
- `app/_lib/credits.ts` - Client-side functions for credit operations
- `app/_components/CreditBalance.tsx` - UI component for displaying/buying credits

✅ **Backend Integration:**
- `app/api/credits/route.ts` - API endpoints for credit management

✅ **Workflow Integration:**
- Updated `app/workflow/page.tsx` to show credit balance

## 🎯 How It Works

### User Flow

1. **Connect Wallet** → User connects Pera Wallet with ALGO
2. **Opt-in** → User clicks "Enable Credits" (one-time setup)
3. **Buy Credits** → User sends ALGO, receives credits on-chain
4. **Use Services** → Backend deducts credits when user runs workflows
5. **Check Balance** → User sees credit balance anytime

### Payment Flow

```
User (ALGO) → Smart Contract → Credits (on-chain)
                                      ↓
                              Backend deducts credits
                                      ↓
                          Company pays agents (USDC via x402)
```

## 💰 Pricing Model

**Default Rate:** 100 credits per ALGO

**Credit Value:** 100 credits = $1 USD (1 USDC)

**Example Costs:**
- Simple workflow (1 agent, 3 steps): 30 credits ($0.30)
- Medium workflow (3 agents, 5 steps): 150 credits ($1.50)
- Complex workflow (5 agents, 10 steps): 500 credits ($5.00)

## 🔧 Smart Contract Functions

### User Functions
- `opt_in()` - Enable credits for your account
- `buy_credits(payment)` - Purchase credits with ALGO
- `get_my_balance()` - Check your credit balance
- `get_rate()` - View conversion rate

### Admin Functions (Backend Only)
- `deduct_credits(user, amount)` - Deduct credits when user uses services
- `set_rate(new_rate)` - Adjust pricing
- `withdraw_algo(receiver, amount)` - Extract accumulated ALGO
- `update_admin(new_admin)` - Transfer admin rights

## 🚀 Testing the System

### 1. Get Testnet ALGO
Visit: https://bank.testnet.algorand.network/
Fund your wallet with at least 1 ALGO

### 2. Test Frontend Flow

```bash
npm run dev
```

1. Navigate to `/workflow`
2. Connect your Pera Wallet
3. Click "Enable Credits" (opt-in)
4. Click "Buy Credits"
5. Enter amount (e.g., 1 ALGO)
6. Confirm transaction in Pera Wallet
7. See your credit balance update

### 3. Test Backend API

**Check Balance:**
```bash
curl "http://localhost:3000/api/credits?address=YOUR_ADDRESS"
```

**Check Sufficient Credits:**
```bash
curl -X POST http://localhost:3000/api/credits \
  -H "Content-Type: application/json" \
  -d '{"action":"check","address":"YOUR_ADDRESS","amount":50}'
```

**Deduct Credits:**
```bash
curl -X POST http://localhost:3000/api/credits \
  -H "Content-Type: application/json" \
  -d '{"action":"deduct","address":"YOUR_ADDRESS","amount":50}'
```

### 4. Verify On-Chain

View your contract on Algorand Explorer:
https://testnet.algoexplorer.io/application/762919965

- Check **Global State** for total credits issued
- Check **Local State** for individual user balances

## 🔗 Integration with Workflows

### Before Running Workflow

Add credit checking to your workflow execution:

```typescript
// In app/api/workflow/route.ts or similar

import { calculateWorkflowCost } from '@/app/_lib/credits';

export async function POST(request: NextRequest) {
  const { userAddress, workflowRequest } = await request.json();
  
  // Estimate cost
  const estimatedCost = calculateWorkflowCost(3, 5); // 3 agents, 5 steps
  
  // Check if user has enough credits
  const checkResponse = await fetch('/api/credits', {
    method: 'POST',
    body: JSON.stringify({
      action: 'check',
      address: userAddress,
      amount: estimatedCost
    })
  });
  
  const { sufficient } = await checkResponse.json();
  
  if (!sufficient) {
    return NextResponse.json(
      { error: 'Insufficient credits', required: estimatedCost },
      { status: 402 }
    );
  }
  
  // Deduct credits
  await fetch('/api/credits', {
    method: 'POST',
    body: JSON.stringify({
      action: 'deduct',
      address: userAddress,
      amount: estimatedCost
    })
  });
  
  // Execute workflow...
  // Pay agents with USDC via x402...
  
  return NextResponse.json({ success: true });
}
```

## 📊 Monitoring

### View Contract Stats

```typescript
import { getTotalCreditsIssued } from '@/app/_lib/credits';

const totalIssued = await getTotalCreditsIssued();
console.log(`Total credits issued: ${totalIssued}`);
```

### Track User Activity

- Monitor credit purchases (on-chain events)
- Track credit consumption patterns
- Calculate average workflow costs
- Identify high-value users

## 🔐 Security Features

✅ **Immutable Ledger** - All transactions recorded on blockchain
✅ **Admin-only Deductions** - Only backend can deduct credits
✅ **Balance Verification** - Contract checks sufficient balance
✅ **Opt-in Required** - Users must explicitly enable credits
✅ **Atomic Transactions** - Credit purchases use grouped transactions

## 🛠️ Admin Operations

### Update Conversion Rate

```typescript
// Backend only - requires admin mnemonic
import algosdk from 'algosdk';

const adminAccount = algosdk.mnemonicToSecretKey(process.env.ADMIN_MNEMONIC!);
const suggestedParams = await algodClient.getTransactionParams().do();

const appCallTxn = algosdk.makeApplicationNoOpTxnFromObject({
  from: adminAccount.addr,
  appIndex: 762919965,
  appArgs: [
    new Uint8Array(Buffer.from('set_rate')),
    algosdk.encodeUint64(200), // New rate: 200 credits per ALGO
  ],
  suggestedParams,
});

const signedTxn = appCallTxn.signTxn(adminAccount.sk);
await algodClient.sendRawTransaction(signedTxn).do();
```

### Withdraw ALGO

```typescript
// Backend only - requires admin mnemonic
const appCallTxn = algosdk.makeApplicationNoOpTxnFromObject({
  from: adminAccount.addr,
  appIndex: 762919965,
  appArgs: [
    new Uint8Array(Buffer.from('withdraw_algo')),
    algosdk.encodeUint64(1_000_000), // 1 ALGO in microALGO
  ],
  accounts: [receiverAddress],
  suggestedParams,
});
```

## 📚 Resources

- **Algorand Docs:** https://developer.algorand.org/
- **PuyaPy Docs:** https://algorandfoundation.github.io/puya/
- **Testnet Faucet:** https://bank.testnet.algorand.network/
- **Explorer:** https://testnet.algoexplorer.io/
- **Pera Wallet:** https://perawallet.app/

## 🐛 Troubleshooting

### "ADMIN_MNEMONIC not set"
- Add your admin mnemonic to `.env.local`
- Use the same account that deployed the contract

### "Insufficient credits" error
- User needs to buy more credits
- Check balance: `GET /api/credits?address=USER_ADDR`

### "User not opted in"
- User must click "Enable Credits" first
- This is a one-time setup per user

### Transaction fails
- Ensure user has ALGO for transaction fees
- Check contract App ID is correct (762919965)
- Verify network is set to testnet

## 🎉 Next Steps

1. ✅ Add admin mnemonic to `.env.local`
2. ✅ Test the credit purchase flow
3. ✅ Integrate credit checking into workflow execution
4. ✅ Monitor contract stats on explorer
5. ✅ Adjust pricing as needed

Your credit system is ready to use! 🚀
