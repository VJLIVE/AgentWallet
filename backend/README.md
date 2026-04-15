# AlgoSub Backend API

Backend API for AlgoSub - AI-powered Algorand payment rules system.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Ollama installed locally
- Supabase account
- Algorand TestNet access

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your configuration
nano .env
```

### Configuration

Edit `.env` file:

```env
# Algorand Network
ALGOD_SERVER=https://testnet-api.algonode.cloud
ALGOD_TOKEN=
INDEXER_SERVER=https://testnet-idx.algonode.cloud
INDEXER_TOKEN=

# Smart Contract
ALGOSUB_APP_ID=758847371

# Ollama Configuration
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2

# Supabase Configuration
SUPABASE_URL=your_supabase_url_here
SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Server Configuration
PORT=3001
NODE_ENV=development

# CORS
FRONTEND_URL=http://localhost:3000
```

### Run Development Server

```bash
npm run dev
```

Server will start at `http://localhost:3001`

## 📡 API Endpoints

### Health Check

```bash
GET /api/health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2026-04-15T10:00:00.000Z",
  "uptime": 123.45
}
```

### Parse Rule (Stage 2)

Convert natural language to structured rule using AI.

```bash
POST /api/parse-rule
Content-Type: application/json

{
  "input": "Allow Swiggy payments under ₹300"
}
```

Response:
```json
{
  "success": true,
  "input": "Allow Swiggy payments under ₹300",
  "rule": {
    "vendor": "Swiggy",
    "maxAmount": 3750000
  }
}
```

### Save Rule (Stage 3)

Save a spending rule to the database.

```bash
POST /api/rules
Content-Type: application/json

{
  "walletAddress": "ALGORAND_ADDRESS_HERE",
  "vendor": "Swiggy",
  "maxAmount": 300000000
}
```

Response:
```json
{
  "success": true,
  "rule": {
    "id": 1,
    "walletAddress": "ALGORAND_ADDRESS_HERE",
    "vendor": "Swiggy",
    "maxAmount": 300000000,
    "createdAt": "2026-04-15T10:00:00.000Z"
  }
}
```

### Get Rules (Stage 3)

Get all rules for a wallet address.

```bash
GET /api/rules/:walletAddress
```

Response:
```json
{
  "success": true,
  "walletAddress": "ALGORAND_ADDRESS_HERE",
  "rules": [
    {
      "id": 1,
      "vendor": "Swiggy",
      "maxAmount": 300000000,
      "createdAt": "2026-04-15T10:00:00.000Z"
    }
  ],
  "count": 1
}
```

### Validate Payment (Stage 4)

Validate a payment against stored rules.

```bash
POST /api/validate-payment
Content-Type: application/json

{
  "walletAddress": "ALGORAND_ADDRESS_HERE",
  "vendor": "Swiggy",
  "amount": 250000000
}
```

Response:
```json
{
  "success": true,
  "validation": {
    "allowed": true,
    "reason": "Payment is within allowed limit",
    "rule": {
      "vendor": "Swiggy",
      "maxAmount": 300000000,
      "maxAmountInAlgo": 300
    },
    "payment": {
      "vendor": "Swiggy",
      "amount": 250000000,
      "amountInAlgo": 250
    },
    "difference": 50000000,
    "differenceInAlgo": 50
  }
}
```

### Execute Payment (Stage 1 & 6)

Execute a payment transaction.

```bash
POST /api/execute-payment
Content-Type: application/json

{
  "walletAddress": "SENDER_ADDRESS",
  "receiver": "RECEIVER_ADDRESS",
  "amount": 250000000,
  "vendor": "Swiggy"
}
```

Response:
```json
{
  "success": true,
  "transaction": {
    "txnId": "TRANSACTION_ID",
    "from": "SENDER_ADDRESS",
    "to": "RECEIVER_ADDRESS",
    "amount": 250000000,
    "amountInAlgo": 250,
    "status": "pending_signature",
    "unsignedTxn": "BASE64_ENCODED_TRANSACTION"
  }
}
```

## 🗄️ Database Setup (Supabase)

Create a `rules` table in Supabase:

```sql
CREATE TABLE rules (
  id BIGSERIAL PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  vendor TEXT NOT NULL,
  max_amount BIGINT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(wallet_address, vendor)
);

-- Create index for faster queries
CREATE INDEX idx_rules_wallet ON rules(wallet_address);
CREATE INDEX idx_rules_vendor ON rules(vendor);
```

## 🤖 Ollama Setup

1. Install Ollama: https://ollama.ai/
2. Pull the model:
   ```bash
   ollama pull llama3.2
   ```
3. Start Ollama (it runs on port 11434 by default)

## 🏗️ Project Structure

```
backend/
├── src/
│   ├── index.js              # Main server file
│   ├── routes/
│   │   ├── health.js         # Health check routes
│   │   ├── rules.js          # Rule management routes
│   │   └── payments.js       # Payment routes
│   └── services/
│       ├── ollama.js         # AI rule parsing
│       ├── supabase.js       # Database operations
│       ├── validation.js     # Payment validation logic
│       └── algorand.js       # Blockchain interactions
├── .env.example              # Environment variables template
├── package.json
└── README.md
```

## 🧪 Testing

Test individual endpoints:

```bash
# Health check
curl http://localhost:3001/api/health

# Parse rule
curl -X POST http://localhost:3001/api/parse-rule \
  -H "Content-Type: application/json" \
  -d '{"input": "Allow Swiggy payments under 300 ALGO"}'
```

## 🔧 Development

```bash
# Run with auto-reload
npm run dev

# Run production
npm start
```

## 📝 Stage Implementation Status

- ✅ Stage 0: Project Setup & Skeleton
- ✅ Stage 1: Wallet + Payment (Foundation)
- ✅ Stage 2: AI Rule Creation (Core Magic)
- ✅ Stage 3: Store Rules (State Layer)
- ✅ Stage 4: Rule Validation Engine
- ✅ Stage 5: Smart Contract (Deployed: 758847371)
- ✅ Stage 6: Integrate Contract with Payment

## 🚀 Next Steps

1. Set up Supabase database
2. Install and configure Ollama
3. Test all endpoints
4. Build frontend integration
5. Add wallet connection (Pera, Defly)

## 📚 Resources

- [Fastify Documentation](https://www.fastify.io/)
- [Algorand SDK](https://developer.algorand.org/docs/sdks/javascript/)
- [Ollama](https://ollama.ai/)
- [Supabase](https://supabase.com/)
