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
    
    console.log(`[x402] Agent account type:`, typeof agentAccount.addr);
    console.log(`[x402] Agent account addr:`, agentAccount.addr);
    
    // In algosdk v3, addr might be an Address object, we need the string
    const fromAddress = typeof agentAccount.addr === 'string' 
      ? agentAccount.addr 
      : algosdk.encodeAddress(agentAccount.addr.publicKey);
    
    console.log(`[x402] Executing automatic payment from agent wallet: ${fromAddress}`);
    console.log(`[x402] To: ${receiverAddress}, Amount: ${amount / 1_000_000} ALGO`);
    
    // Get suggested params
    const params = await algodClient.getTransactionParams().do();
    console.log(`[x402] Transaction params received from network`);

    // Validate addresses
    if (!fromAddress || !receiverAddress) {
      throw new Error(`Invalid addresses - from: ${fromAddress}, to: ${receiverAddress}`);
    }

    console.log(`[x402] Creating payment transaction...`);

    // algosdk v3 renamed from/to -> sender/receiver and uses Address objects
    const senderAddr = algosdk.Address.fromString(fromAddress);
    const receiverAddr = algosdk.Address.fromString(receiverAddress);

    // Create payment transaction - algosdk v3 API
    const paymentTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      sender: senderAddr,
      receiver: receiverAddr,
      amount: amount,
      suggestedParams: params,
    });

    console.log(`[x402] Transaction created successfully, signing...`);

    // Sign transaction with agent's private key
    const signedTxn = paymentTxn.signTxn(agentAccount.sk);

    console.log(`[x402] Transaction signed, submitting to network...`);

    // Send transaction - algosdk v3 returns { txid } (lowercase)
    const sendResult = await algodClient.sendRawTransaction(signedTxn).do();
    const txId = sendResult.txid;

    console.log(`[x402] Transaction submitted: ${txId}`);

    // Wait for confirmation - algosdk v3 returns confirmedRound as bigint
    const confirmedTxn = await algosdk.waitForConfirmation(algodClient, txId, 4);
    
    console.log(`[x402] Transaction confirmed in round: ${confirmedTxn.confirmedRound}`);

    return {
      txId,
      confirmedRound: Number(confirmedTxn.confirmedRound),
      from: fromAddress,
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
    const addr = agentAccount.addr;
    return typeof addr === 'string' ? addr : algosdk.encodeAddress(addr.publicKey);
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
