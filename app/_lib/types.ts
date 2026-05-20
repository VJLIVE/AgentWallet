// ─── Core Domain Types ────────────────────────────────────────────────────────

export interface Agent {
  id: string;
  name: string;
  description: string;
  endpoint: string;
  supportedTasks: string[];
  pricing: {
    basePrice: number;   // in USDC
    perToken: number;
  };
  reputation: number;
  totalJobs: number;
  successfulJobs?: number;  // from reputation table (optional — not always joined)
  failedJobs?: number;      // from reputation table (optional — not always joined)
  ownerWallet: string;  // Algorand address
  model: string;
  latency: number;      // ms
  createdAt: string;
}

export interface Job {
  id: string;
  requesterWallet: string;   // Algorand address of the user/agent that requested
  providerAgentId: string;
  task: string;
  paymentAmount: number;     // USDC amount
  status: 'pending' | 'negotiating' | 'executing' | 'completed' | 'failed';
  txHash: string | null;     // Algorand transaction ID
  resultHash: string | null; // SHA-256 of result for on-chain proof
  result: string | null;
  createdAt: string;
  completedAt: string | null;
}

export interface Transaction {
  id: string;
  txHash: string;            // Algorand transaction ID
  sender: string;            // Algorand address
  receiver: string;          // Algorand address
  amount: number;            // USDC amount
  asaId: string;             // ASA ID (USDC)
  resource: string;          // x402 resource path
  x402Version: number;
  network: string;           // CAIP-2 network identifier
  confirmed: boolean;
  createdAt: string;
}

export interface WorkflowStep {
  task: string;
  requiredAgent: string;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  agentId?: string;
  agentName?: string;
  negotiatedPrice?: number;
  txHash?: string;
  result?: string;
}

export interface NegotiationOffer {
  agentId: string;
  initialOffer: number;
  counter?: number;
  finalPrice?: number;
  accepted: boolean;
}

// x402 payment requirement shape (subset of @x402/core PaymentRequirements)
export interface X402PaymentRequirement {
  scheme: string;
  network: string;
  payTo: string;
  amount: string;
  asset: string;
  resource: string;
  description: string;
  extra?: Record<string, unknown>;
}

// What the /api/pay route returns after settlement
export interface PaymentResult {
  txHash: string;
  confirmed: boolean;
  amount: number;
  asset: string;
  network: string;
  receiver: string;
  resource: string;
}
