# AgentWallet - API Reference

## Base URL
```
http://localhost:3001/api
```

---

## 🤖 AI Agent Endpoints

### Execute Agent Task
Execute an autonomous agent task with budget constraints.

**Endpoint:** `POST /agent/execute-task`

**Request Body:**
```json
{
  "taskDescription": "Summarize PDF under 1 ALGO",
  "budget": 1000000,
  "walletAddress": "ALGORAND_ADDRESS_HERE"
}
```

**Response (Success):**
```json
{
  "success": true,
  "result": {
    "agentId": "agent_1713456789000",
    "status": "planned",
    "plan": {
      "services": [
        {
          "id": "pdf-parser-cheap",
          "name": "Basic PDF Parser",
          "vendor": "PDFCo",
          "cost": 500000,
          "description": "Basic PDF text extraction"
        }
      ],
      "reasoning": "Selected 1 service(s) based on task requirements and budget"
    },
    "logs": [
      {
        "timestamp": "2026-04-15T10:30:00.000Z",
        "type": "task_start",
        "message": "Task received: Summarize PDF under 1 ALGO",
        "data": {
          "budget": 1000000,
          "budgetInAlgo": 1.0
        }
      }
    ],
    "totalCost": 500000
  }
}
```

**Status Values:**
- `planned` - Task successfully planned within budget
- `optimized` - Task optimized to fit budget constraints
- `failed` - Task execution failed

---

### Attempt Payment
AI agent attempts a payment and receives a structured decision.

**Endpoint:** `POST /agent/attempt-payment`

**Request Body:**
```json
{
  "agentId": "agent_1713456789000",
  "walletAddress": "ALGORAND_ADDRESS_HERE",
  "service": "PDFCo",
  "amount": 500000,
  "metadata": {
    "serviceId": "pdf-parser-cheap",
    "task": "PDF parsing"
  }
}
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
    },
    "metadata": {
      "serviceId": "pdf-parser-cheap",
      "task": "PDF parsing"
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
    "guidance": "Create a spending rule for PDFPro before attempting payments",
    "rule": null,
    "metadata": {}
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
    "guidance": "Reduce payment amount or choose a cheaper service alternative",
    "rule": {
      "vendor": "PDFCo",
      "maxAmount": 1000000,
      "maxAmountInAlgo": 1.0
    },
    "metadata": {}
  }
}
```

**Decision Status Values:**
- `approved` - Payment approved, proceed with transaction
- `blocked` - Payment blocked, cannot proceed
- `modified` - Payment exceeds limit, use allowedAmount instead
- `error` - Validation error occurred

---

### Get Agent Logs
Retrieve agent execution logs for a wallet address.

**Endpoint:** `GET /agent/logs/:walletAddress`

**Query Parameters:**
- `agentId` (optional) - Filter logs by specific agent ID
- `limit` (optional) - Maximum number of logs to return (default: 100)

**Example:**
```
GET /agent/logs/ALGORAND_ADDRESS_HERE?limit=50
```

**Response:**
```json
{
  "success": true,
  "logs": [
    {
      "id": 1,
      "agentId": "agent_1713456789000",
      "walletAddress": "ALGORAND_ADDRESS_HERE",
      "logType": "task_start",
      "message": "Task received: Summarize PDF under 1 ALGO",
      "data": {
        "budget": 1000000,
        "budgetInAlgo": 1.0
      },
      "timestamp": "2026-04-15T10:30:00.000Z"
    },
    {
      "id": 2,
      "agentId": "agent_1713456789000",
      "walletAddress": "ALGORAND_ADDRESS_HERE",
      "logType": "planning",
      "message": "Agent planning: Selected 1 service(s)",
      "data": {
        "selectedServices": [...]
      },
      "timestamp": "2026-04-15T10:30:01.000Z"
    }
  ],
  "count": 2
}
```

**Log Types:**
- `task_start` - Task execution started
- `planning` - Agent planning phase
- `cost_calculation` - Cost calculation performed
- `budget_exceeded` - Initial plan exceeds budget
- `optimization` - Plan optimization performed
- `payment_attempt` - Payment attempt made
- `payment_approved` - Payment approved
- `payment_blocked` - Payment blocked
- `payment_modified` - Payment modified
- `error` - Error occurred

---

### Get Service Catalog
Retrieve available services that agents can use.

**Endpoint:** `GET /agent/services`

**Response:**
```json
{
  "success": true,
  "services": [
    {
      "id": "pdf-parser-cheap",
      "name": "Basic PDF Parser",
      "vendor": "PDFCo",
      "cost": 500000,
      "description": "Basic PDF text extraction"
    },
    {
      "id": "pdf-parser-premium",
      "name": "Premium PDF Parser",
      "vendor": "PDFPro",
      "cost": 2000000,
      "description": "Advanced PDF parsing with OCR"
    },
    {
      "id": "llm-summarize-cheap",
      "name": "Basic Summarizer",
      "vendor": "TextAI",
      "cost": 300000,
      "description": "Simple text summarization"
    },
    {
      "id": "llm-summarize-premium",
      "name": "Premium Summarizer",
      "vendor": "OpenAI",
      "cost": 1500000,
      "description": "Advanced AI summarization"
    }
  ],
  "count": 4
}
```

---

### Get Service by ID
Retrieve details for a specific service.

**Endpoint:** `GET /agent/services/:serviceId`

**Example:**
```
GET /agent/services/pdf-parser-cheap
```

**Response:**
```json
{
  "success": true,
  "service": {
    "id": "pdf-parser-cheap",
    "name": "Basic PDF Parser",
    "vendor": "PDFCo",
    "cost": 500000,
    "description": "Basic PDF text extraction"
  }
}
```

---

## 📝 Rule Management Endpoints

### Parse Rule
Parse natural language rule using AI.

**Endpoint:** `POST /parse-rule`

**Request Body:**
```json
{
  "input": "Allow PDFCo payments under 1 ALGO"
}
```

**Response:**
```json
{
  "success": true,
  "rule": {
    "vendor": "PDFCo",
    "maxAmount": 1000000
  }
}
```

---

### Save Rule
Save a spending rule to the database.

**Endpoint:** `POST /rules`

**Request Body:**
```json
{
  "walletAddress": "ALGORAND_ADDRESS_HERE",
  "vendor": "PDFCo",
  "maxAmount": 1000000
}
```

**Response:**
```json
{
  "success": true,
  "rule": {
    "id": 1,
    "walletAddress": "ALGORAND_ADDRESS_HERE",
    "vendor": "PDFCo",
    "maxAmount": 1000000,
    "createdAt": "2026-04-15T10:30:00.000Z"
  }
}
```

---

### Get Rules
Get all rules for a wallet address.

**Endpoint:** `GET /rules/:walletAddress`

**Response:**
```json
{
  "success": true,
  "rules": [
    {
      "id": 1,
      "walletAddress": "ALGORAND_ADDRESS_HERE",
      "vendor": "PDFCo",
      "maxAmount": 1000000,
      "createdAt": "2026-04-15T10:30:00.000Z"
    }
  ],
  "count": 1
}
```

---

### Validate Payment
Validate a payment against stored rules.

**Endpoint:** `POST /validate-payment`

**Request Body:**
```json
{
  "walletAddress": "ALGORAND_ADDRESS_HERE",
  "vendor": "PDFCo",
  "amount": 500000
}
```

**Response:**
```json
{
  "success": true,
  "validation": {
    "allowed": true,
    "reason": "Payment is within allowed limit",
    "rule": {
      "vendor": "PDFCo",
      "maxAmount": 1000000,
      "maxAmountInAlgo": 1.0
    },
    "payment": {
      "vendor": "PDFCo",
      "amount": 500000,
      "amountInAlgo": 0.5
    },
    "difference": 500000,
    "differenceInAlgo": 0.5
  }
}
```

---

## 🏥 System Endpoints

### Health Check
Check if the API is running.

**Endpoint:** `GET /health`

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-04-15T10:30:00.000Z",
  "services": {
    "algorand": true,
    "ollama": true,
    "supabase": true
  }
}
```

---

### API Information
Get API information and available endpoints.

**Endpoint:** `GET /`

**Response:**
```json
{
  "name": "AgentWallet - Autonomous Payment Guardian",
  "version": "2.0.0",
  "status": "running",
  "endpoints": {
    "health": "/api/health",
    "parseRule": "POST /api/parse-rule",
    "saveRule": "POST /api/rules",
    "getRules": "GET /api/rules/:walletAddress",
    "validatePayment": "POST /api/validate-payment",
    "executePayment": "POST /api/execute-payment",
    "executeTask": "POST /api/agent/execute-task",
    "attemptPayment": "POST /api/agent/attempt-payment",
    "getAgentLogs": "GET /api/agent/logs/:walletAddress",
    "getServices": "GET /api/agent/services"
  }
}
```

---

## 🔢 Amount Conversions

All amounts in the API are in **microAlgos** (1 ALGO = 1,000,000 microAlgos).

**Examples:**
- 0.5 ALGO = 500,000 microAlgos
- 1 ALGO = 1,000,000 microAlgos
- 2 ALGO = 2,000,000 microAlgos

**Conversion Functions:**
```javascript
// ALGO to microAlgos
const microAlgos = algo * 1_000_000;

// microAlgos to ALGO
const algo = microAlgos / 1_000_000;
```

---

## 🚨 Error Responses

All endpoints return errors in this format:

```json
{
  "error": "Error message",
  "message": "Detailed error description"
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `400` - Bad Request (missing or invalid parameters)
- `404` - Not Found (resource doesn't exist)
- `500` - Internal Server Error

---

## 📚 Example Workflows

### Workflow 1: Execute Agent Task

```bash
# 1. Execute task
curl -X POST http://localhost:3001/api/agent/execute-task \
  -H "Content-Type: application/json" \
  -d '{
    "taskDescription": "Summarize PDF under 1 ALGO",
    "budget": 1000000,
    "walletAddress": "YOUR_ADDRESS"
  }'

# 2. Get agent logs
curl http://localhost:3001/api/agent/logs/YOUR_ADDRESS?limit=10

# 3. Attempt payment for selected service
curl -X POST http://localhost:3001/api/agent/attempt-payment \
  -H "Content-Type: application/json" \
  -d '{
    "agentId": "agent_1713456789000",
    "walletAddress": "YOUR_ADDRESS",
    "service": "PDFCo",
    "amount": 500000
  }'
```

### Workflow 2: Create Rule and Validate

```bash
# 1. Parse rule with AI
curl -X POST http://localhost:3001/api/parse-rule \
  -H "Content-Type: application/json" \
  -d '{"input": "Allow PDFCo payments under 1 ALGO"}'

# 2. Save rule
curl -X POST http://localhost:3001/api/rules \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress": "YOUR_ADDRESS",
    "vendor": "PDFCo",
    "maxAmount": 1000000
  }'

# 3. Validate payment
curl -X POST http://localhost:3001/api/validate-payment \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress": "YOUR_ADDRESS",
    "vendor": "PDFCo",
    "amount": 500000
  }'
```

---

## 🔐 Authentication

Currently, the API does not require authentication. In production, you should implement:
- API key authentication
- JWT tokens
- Rate limiting
- CORS restrictions

---

## 📞 Support

For issues or questions:
- Check the main [README.md](../README.md)
- Review the [DEMO_GUIDE.md](../DEMO_GUIDE.md)
- Open an issue on GitHub
