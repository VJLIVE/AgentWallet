/**
 * Credit System Integration
 * Client-side functions for interacting with the credit smart contract
 */

import algosdk from 'algosdk';

// Algorand client
const ALGOD_SERVER = 'https://testnet-api.algonode.cloud';
const ALGOD_PORT = 443;
export const algodClient = new algosdk.Algodv2('', ALGOD_SERVER, ALGOD_PORT);

// Contract App ID
export const CREDIT_CONTRACT_ID = parseInt(
  process.env.NEXT_PUBLIC_CREDIT_CONTRACT_ID || '762919965'
);

/**
 * Check if user has opted into the credit contract
 */
export async function hasOptedIn(userAddress: string): Promise<boolean> {
  try {
    const accountInfo = await algodClient.accountInformation(userAddress).do();
    // algosdk v3: camelCase
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const appsLocalState = (accountInfo as any).appsLocalState ?? [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return appsLocalState.some((app: any) => {
      const id = typeof app.id === 'bigint' ? Number(app.id) : Number(app.id);
      return id === CREDIT_CONTRACT_ID;
    });
  } catch (error) {
    console.error('Error checking opt-in status:', error);
    return false;
  }
}

/**
 * Opt user into the credit contract
 * Required before user can hold credits
 */
export async function optInToContract(
  userAddress: string,
  signTransactions: (txns: Uint8Array[], indexesToSign: number[]) => Promise<Uint8Array[]>
): Promise<string> {
  if (!userAddress) {
    throw new Error('User address is required');
  }

  const suggestedParams = await algodClient.getTransactionParams().do();

  // Keep the default 1000-round window (Algorand's maximum)

  // This is an ARC4 contract — opt_in()void must be called with the ABI method selector
  // Selector = first 4 bytes of SHA-512/256 of "opt_in()void" = 0x30c6d58a
  const abiMethod = algosdk.ABIMethod.fromSignature('opt_in()void');

  const optInTxn = algosdk.makeApplicationOptInTxnFromObject({
    sender: userAddress,
    appIndex: CREDIT_CONTRACT_ID,
    appArgs: [abiMethod.getSelector()],
    suggestedParams,
  });

  const txnBytes = algosdk.encodeUnsignedTransaction(optInTxn);
  const signedTxns = await signTransactions([txnBytes], [0]);
  const optInResult = await algodClient.sendRawTransaction(signedTxns).do();
  const txId = optInResult.txid ?? '';
  // Wait up to 10 rounds for confirmation
  await algosdk.waitForConfirmation(algodClient, txId, 10);
  return txId;
}

/**
 * Buy credits with ALGO
 * Creates a grouped transaction: payment + app call
 */
export async function buyCredits(
  userAddress: string,
  algoAmount: number,
  signTransactions: (txns: Uint8Array[], indexesToSign: number[]) => Promise<Uint8Array[]>
): Promise<{ txId: string; creditsAdded: number }> {
  const suggestedParams = await algodClient.getTransactionParams().do();

  // Get company wallet address from contract
  const companyWallet = await getCompanyWallet();

  // Convert ALGO to microALGO
  const microAlgoAmount = Math.floor(algoAmount * 1_000_000);

  // Transaction 1: Payment to company wallet
  const paymentTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    sender: userAddress,
    receiver: companyWallet,
    amount: microAlgoAmount,
    suggestedParams,
  });

  // Transaction 2: App call to record credit purchase
  // ARC4 ABI: must include method selector for buy_credits(pay)uint64
  const buyCreditsMethod = algosdk.ABIMethod.fromSignature('buy_credits(pay)uint64');
  const appCallTxn = algosdk.makeApplicationNoOpTxnFromObject({
    sender: userAddress,
    appIndex: CREDIT_CONTRACT_ID,
    appArgs: [buyCreditsMethod.getSelector()],
    suggestedParams,
  });

  // Group transactions
  const txnGroup = algosdk.assignGroupID([paymentTxn, appCallTxn]);

  // Encode transactions
  const txnBytes = txnGroup.map(txn => algosdk.encodeUnsignedTransaction(txn));

  // Sign both transactions
  const signedTxns = await signTransactions(txnBytes, [0, 1]);

  // Send transaction group
  const sendResult = await algodClient.sendRawTransaction(signedTxns).do();
  const txId = sendResult.txid ?? '';

  // Wait for confirmation — if polling times out, the tx likely already confirmed
  try {
    await algosdk.waitForConfirmation(algodClient, txId, 10);
  } catch (waitErr: any) {
    if (!waitErr?.message?.includes('not confirmed after')) {
      throw waitErr;
    }
    // Timeout just means our polling was slow — tx is on-chain, continue
  }

  // Calculate credits added
  const rate = await getConversionRate();
  const creditsAdded = algoAmount * rate;

  return { txId, creditsAdded };
}

/**
 * Get user's credit balance
 */
export async function getCreditBalance(userAddress: string): Promise<number> {
  try {
    const accountInfo = await algodClient
      .accountApplicationInformation(userAddress, CREDIT_CONTRACT_ID)
      .do();

    // algosdk v3: uses camelCase 'appLocalState' and 'keyValue'
    const localState = (accountInfo as any)?.appLocalState?.keyValue ?? [];

    if (!localState || !Array.isArray(localState)) {
      return 0;
    }

    // Key is a Uint8Array / number array in v3 — compare by byte values
    const keyBytes = Array.from(Buffer.from('user_credits'));
    const entry = localState.find((kv: any) => {
      const k: number[] = Array.from(kv.key instanceof Uint8Array ? kv.key : kv.key);
      return k.length === keyBytes.length && k.every((b, i) => b === keyBytes[i]);
    });

    if (!entry) return 0;

    // value.uint is a string in v3
    const raw = entry.value?.uint;
    if (raw === undefined || raw === null) return 0;
    return Number(raw);
  } catch (error: any) {
    if (error?.status === 404 || error?.message?.includes('application info not found')) {
      return 0;
    }
    console.error('Error getting credit balance:', error);
    return 0;
  }
}

/**
 * Helper to find a value in algosdk v3 global state by key string
 */
function findGlobalStateValue(globalState: any[], keyStr: string): any | undefined {
  const keyBytes = Buffer.from(keyStr);
  return globalState.find((kv: any) => {
    const k = kv.key;
    if (!k) return false;
    // v3 returns key as Uint8Array
    const keyBuf = k instanceof Uint8Array ? Buffer.from(k) : Buffer.from(k, 'base64');
    return keyBuf.equals(keyBytes);
  });
}

/**
 * Get ALGO to credit conversion rate from contract
 */
export async function getConversionRate(): Promise<number> {
  try {
    const appInfo = await algodClient
      .getApplicationByID(CREDIT_CONTRACT_ID)
      .do();

    // algosdk v3 uses camelCase 'globalState'
    const globalState = (appInfo.params as any)?.globalState ?? [];
    
    if (!globalState || !Array.isArray(globalState)) {
      console.warn('Global state not found or invalid');
      return 100;
    }

    const entry = findGlobalStateValue(globalState, 'algo_to_credit_rate');
    if (!entry) return 100;

    const raw = entry.value?.uint;
    if (raw === undefined) return 100;
    return typeof raw === 'bigint' ? Number(raw) : Number(raw);
  } catch (error) {
    console.error('Error getting conversion rate:', error);
    return 100;
  }
}

/**
 * Get company wallet address from contract
 */
export async function getCompanyWallet(): Promise<string> {
  try {
    const appInfo = await algodClient
      .getApplicationByID(CREDIT_CONTRACT_ID)
      .do();

    // algosdk v3 uses camelCase 'globalState'
    const globalState = (appInfo.params as any)?.globalState ?? [];
    
    if (!globalState || !Array.isArray(globalState)) {
      throw new Error('Global state not found');
    }

    const entry = findGlobalStateValue(globalState, 'company_wallet');
    if (!entry) throw new Error('Company wallet not found in global state');

    const bytes = entry.value?.bytes;
    if (!bytes) throw new Error('Company wallet bytes not found');

    // v3 returns bytes as Uint8Array directly
    const pubKey = bytes instanceof Uint8Array ? bytes : Buffer.from(bytes, 'base64');
    return algosdk.encodeAddress(pubKey);
  } catch (error) {
    console.error('Error getting company wallet:', error);
    throw error;
  }
}

/**
 * Get total credits issued (global stat)
 */
export async function getTotalCreditsIssued(): Promise<number> {
  try {
    const appInfo = await algodClient
      .getApplicationByID(CREDIT_CONTRACT_ID)
      .do();

    // algosdk v3 uses camelCase 'globalState'
    const globalState = (appInfo.params as any)?.globalState ?? [];
    
    if (!globalState || !Array.isArray(globalState)) {
      return 0;
    }

    const entry = findGlobalStateValue(globalState, 'total_credits_issued');
    if (!entry) return 0;

    const raw = entry.value?.uint;
    if (raw === undefined) return 0;
    return typeof raw === 'bigint' ? Number(raw) : Number(raw);
  } catch (error) {
    console.error('Error getting total credits:', error);
    return 0;
  }
}

/**
 * Format credits for display (with USDC equivalent)
 * Assuming 100 credits = 1 USDC
 */
export function formatCredits(credits: number): {
  credits: number;
  usdcEquivalent: string;
} {
  return {
    credits,
    usdcEquivalent: (credits / 100).toFixed(2),
  };
}

/**
 * Calculate cost in credits for a workflow
 * Based on estimated agent costs
 */
export function calculateWorkflowCost(
  numAgents: number,
  estimatedSteps: number
): number {
  // Pricing: 10 credits per agent call
  const baseCreditsPerAgent = 10;
  return numAgents * estimatedSteps * baseCreditsPerAgent;
}
