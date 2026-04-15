# AlgoSub Frontend

Next.js frontend for AlgoSub - AI-powered Algorand payment rules system.

## 🚀 Features

- **Wallet Integration**: Connect with Pera Wallet
- **AI Rule Creation**: Natural language rule parsing
- **Rule Management**: View and manage spending rules
- **Payment Execution**: Send payments with automatic validation
- **Real-time Feedback**: Toast notifications for all actions

## 📋 Prerequisites

- Node.js 18+
- Backend API running on port 3001
- Pera Wallet mobile app or browser extension

## 🛠️ Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.local.example .env.local

# Start development server
npm run dev
```

## 🔧 Configuration

Edit `.env.local`:

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
NEXT_PUBLIC_ALGOD_SERVER=https://testnet-api.algonode.cloud
NEXT_PUBLIC_ALGOD_TOKEN=
NEXT_PUBLIC_ALGOSUB_APP_ID=758847371
```

## 🎯 Usage

### 1. Connect Wallet

Click "Connect Pera Wallet" and scan QR code with Pera Wallet app or approve in browser extension.

### 2. Create Spending Rules

Enter natural language rules like:
- "Allow Swiggy payments under 300 ALGO"
- "Set Zomato limit to ₹500"
- "Amazon payments max $100"

The AI will parse and structure your rule.

### 3. Make Payments

Fill in:
- Vendor name (must match a rule)
- Receiver address
- Amount in ALGO

Payment will be validated against your rules before execution.

## 📁 Project Structure

```
frontend/
├── app/
│   ├── layout.tsx          # Root layout with providers
│   ├── page.tsx            # Main page
│   └── globals.css         # Global styles
├── components/
│   ├── WalletButton.tsx    # Wallet connect/disconnect
│   ├── RuleCreator.tsx     # AI rule creation form
│   ├── RulesList.tsx       # Display user's rules
│   └── PaymentForm.tsx     # Payment execution form
├── contexts/
│   └── WalletContext.tsx   # Wallet state management
├── lib/
│   ├── algorand.ts         # Algorand utilities
│   └── api.ts              # Backend API client
└── .env.local              # Environment variables
```

## 🔗 API Integration

The frontend communicates with the backend API:

- `POST /api/parse-rule` - Parse natural language rules
- `POST /api/rules` - Save rules
- `GET /api/rules/:address` - Get user's rules
- `POST /api/validate-payment` - Validate payments

## 🎨 Components

### WalletButton
Handles Pera Wallet connection/disconnection.

### RuleCreator
- Text input for natural language rules
- AI parsing with Ollama
- Rule preview and save

### RulesList
- Displays all user rules
- Shows vendor and max amount
- Auto-refreshes on rule creation

### PaymentForm
- Payment details input
- Rule validation
- Transaction signing and sending
- Transaction ID display with explorer link

## 🧪 Testing

1. **Connect Wallet**: Use Pera Wallet TestNet mode
2. **Create Rule**: "Allow TestVendor payments under 10 ALGO"
3. **Make Payment**: Send 5 ALGO to any address with vendor "TestVendor"
4. **Verify**: Check transaction on AlgoExplorer

## 🐛 Troubleshooting

### Wallet Won't Connect

- Ensure Pera Wallet is installed
- Check you're on TestNet in Pera Wallet
- Try refreshing the page

### Rules Not Saving

- Verify backend is running on port 3001
- Check Supabase is configured
- Check browser console for errors

### Payment Fails

- Ensure you have TestNet ALGO
- Verify rule exists for the vendor
- Check amount doesn't exceed rule limit

## 🚀 Deployment

```bash
# Build for production
npm run build

# Start production server
npm start
```

## 📚 Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Pera Wallet Connect](https://github.com/perawallet/connect)
- [Algorand SDK](https://developer.algorand.org/docs/sdks/javascript/)
- [AlgoExplorer TestNet](https://testnet.algoexplorer.io/)
