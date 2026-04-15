/**
 * x402 Payment Protocol Service
 * Automatic payment execution without user approval
 */
import algosdk from 'algosdk';

// Initialize Algod client
const algodClient = new algosdk.Algodv2(
  process.env.ALGOD_TOKEN || '',
  process.env.ALGOD_SERVER || 'https://testnet-api.algonode.cloud',
  ''
);

/**
 * Execute x402 payment automatically
 * Uses a pre-configured payment account (agent wallet)
 * @param {Object} params - Payment parameters
 * @returns {Promise<Object>} Transaction result
 */
export async function executeX402Payment({
  receiverAddress,
  amount,
  note = '',
}) {
  try {
    // Get agent wallet mnemonic from environment
    const agentMnemonic = process.env.AGENT_WALLET_MNEMONIC;
    
    if (!agentMnemonic) {
      throw new Error('Agent wallet not configured. Set AGENT_WALLET_MNEMONIC in .env');
    }

    // Recover agent account from mnemonic
    const agentAccount = algosdk.mnemonicToSecretKey(agentMnemonic);
    
    console.log(`[x402] Executing automatic payment from agent wallet: ${agentAccount.addr}`);
    console.log(`[x402] To: ${receiverAddress}, Amount: ${amount / 1_000_000} ALGO`);
    
    // Get suggested params
    const suggestedParams = await algodClient.getTransactionParams().do();

    // Create payment transaction
    const paymentTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      from: agentAccount.addr,
      to: receiverAddress,
      amount: amount,
      note: note ? new Uint8Array(Buffer.from(note)) : undefined,
      suggestedParams,
    });

    // Sign transaction with agent's private key
    const signedTxn = paymentTxn.signTxn(agentAccount.sk);

    // Send transaction
    const { txId } = await algodClient.sendRawTransaction(signedTxn).do();
    
    console.log(`[x402] Transaction submitted: ${txId}`);

    // Wait for confirmation
    const confirmedTxn = await algosdk.waitForConfirmation(algodClient, txId, 4);
    
    console.log(`[x402] Transaction confirmed in round: ${confirmedTxn['confirmed-round']}`);

    return {
      txId,
      confirmedRound: confirmedTxn['confirmed-round'],
      from: agentAccount.addr,
      to: receiverAddress,
      amount,
      amountInAlgo: amount / 1_000_000,
      status: 'confirmed',
      message: 'x402 payment executed and confirmed successfully',
      protocol: 'x402',
    };
  } catch (error) {
    console.error('[x402] Payment execution failed:', error);
    throw new Error(`x402 payment failed: ${error.message}`);
  }
}

/**
 * Check if x402 is configured
 * @returns {boolean} True if agent wallet is configured
 */
export function isX402Configured() {
  return !!process.env.AGENT_WALLET_MNEMONIC;
}

/**
 * Get agent wallet address
 * @returns {string|null} Agent wallet address or null if not configured
 */
export function getAgentWalletAddress() {
  try {
    const agentMnemonic = process.env.AGENT_WALLET_MNEMONIC;
    if (!agentMnemonic) return null;
    
    const agentAccount = algosdk.mnemonicToSecretKey(agentMnemonic);
    return agentAccount.addr;
  } catch (error) {
    console.error('[x402] Failed to get agent wallet address:', error);
    return null;
  }
}

/**
 * Get agent wallet balance
 * @returns {Promise<Object>} Balance information
 */
export async function getAgentWalletBalance() {
  try {
    const agentAddress = getAgentWalletAddress();
    if (!agentAddress) {
      throw new Error('Agent wallet not configured');
    }

    const accountInfo = await algodClient.accountInformation(agentAddress).do();
    
    return {
      address: agentAddress,
      balance: accountInfo.amount,
      balanceInAlgo: accountInfo.amount / 1_000_000,
      minBalance: accountInfo['min-balance'],
      minBalanceInAlgo: accountInfo['min-balance'] / 1_000_000,
    };
  } catch (error) {
    console.error('[x402] Failed to get agent wallet balance:', error);
    throw error;
  }
}
