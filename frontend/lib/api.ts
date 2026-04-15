/**
 * Backend API client
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

export interface Rule {
  id?: number;
  walletAddress: string;
  vendor: string;
  maxAmount: number;
  createdAt?: string;
}

export interface ParsedRule {
  vendor: string;
  maxAmount: number;
}

export interface ValidationResult {
  allowed: boolean;
  reason: string;
  rule: {
    vendor: string;
    maxAmount: number;
    maxAmountInAlgo: number;
  } | null;
  payment: {
    vendor: string;
    amount: number;
    amountInAlgo: number;
  };
  difference?: number;
  differenceInAlgo?: number;
}

/**
 * Parse natural language rule using AI
 */
export async function parseRule(input: string): Promise<ParsedRule> {
  const response = await fetch(`${API_BASE_URL}/api/parse-rule`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ input }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to parse rule');
  }

  const data = await response.json();
  return data.rule;
}

/**
 * Save a rule to the database
 */
export async function saveRule(rule: Rule): Promise<Rule> {
  const response = await fetch(`${API_BASE_URL}/api/rules`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(rule),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to save rule');
  }

  const data = await response.json();
  return data.rule;
}

/**
 * Get all rules for a wallet address
 */
export async function getRules(walletAddress: string): Promise<Rule[]> {
  const response = await fetch(`${API_BASE_URL}/api/rules/${walletAddress}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch rules');
  }

  const data = await response.json();
  return data.rules;
}

/**
 * Validate a payment against stored rules
 */
export async function validatePayment(
  walletAddress: string,
  vendor: string,
  amount: number
): Promise<ValidationResult> {
  const response = await fetch(`${API_BASE_URL}/api/validate-payment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ walletAddress, vendor, amount }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to validate payment');
  }

  const data = await response.json();
  return data.validation;
}

// ============================================
// AI Agent API Functions
// ============================================

export interface AgentService {
  id: string;
  name: string;
  vendor: string;
  cost: number;
  description: string;
}

export interface AgentLog {
  id: number;
  agentId: string;
  walletAddress: string;
  logType: string;
  message: string;
  data: any;
  timestamp: string;
}

export interface AgentDecision {
  status: 'approved' | 'blocked' | 'modified' | 'error';
  reason: string;
  allowedAmount?: number;
  allowedAmountInAlgo?: number;
  requestedAmount: number;
  requestedAmountInAlgo: number;
  difference?: number;
  differenceInAlgo?: number;
  guidance?: string;
  rule?: {
    vendor: string;
    maxAmount: number;
    maxAmountInAlgo: number;
  } | null;
  metadata?: any;
}

export interface AgentTaskResult {
  agentId: string;
  status: 'planned' | 'optimized' | 'executed' | 'failed';
  plan?: {
    services: AgentService[];
    reasoning: string;
  };
  selectedService?: AgentService;
  paymentResult?: {
    txId: string;
    confirmedRound: number;
    from: string;
    to: string;
    amount: number;
    amountInAlgo: number;
    status: string;
    message: string;
    protocol: string;
  };
  logs: any[];
  totalCost?: number;
  error?: string;
}

/**
 * Execute an AI agent task with x402 automatic payment
 */
export async function executeAgentTask(
  taskDescription: string,
  budget: number,
  walletAddress: string
): Promise<AgentTaskResult> {
  const response = await fetch(`${API_BASE_URL}/api/agent/execute-task`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ taskDescription, budget, walletAddress }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to execute agent task');
  }

  const data = await response.json();
  return data.result;
}

/**
 * Agent attempts a payment
 */
export async function attemptAgentPayment(
  agentId: string,
  walletAddress: string,
  service: string,
  amount: number,
  metadata?: any
): Promise<AgentDecision> {
  const response = await fetch(`${API_BASE_URL}/api/agent/attempt-payment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ agentId, walletAddress, service, amount, metadata }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to attempt payment');
  }

  const data = await response.json();
  return data.decision;
}

/**
 * Get agent logs for a wallet
 */
export async function getAgentLogs(
  walletAddress: string,
  agentId?: string,
  limit?: number
): Promise<AgentLog[]> {
  const params = new URLSearchParams();
  if (agentId) params.append('agentId', agentId);
  if (limit) params.append('limit', limit.toString());

  const url = `${API_BASE_URL}/api/agent/logs/${walletAddress}${params.toString() ? '?' + params.toString() : ''}`;
  const response = await fetch(url);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch agent logs');
  }

  const data = await response.json();
  return data.logs;
}

/**
 * Get available services catalog
 */
export async function getAgentServices(): Promise<AgentService[]> {
  const response = await fetch(`${API_BASE_URL}/api/agent/services`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch services');
  }

  const data = await response.json();
  return data.services;
}
