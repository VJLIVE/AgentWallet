/**
 * Algorand Blockchain Service
 * Stage 1: Wallet + Payment
 * Stage 6: Integrate Contract with Payment
 */
import algosdk from 'algosdk';

// Initialize Algod client
const algodClient = new algosdk.Algodv2(
  process.env.ALGOD_TOKEN || '',
  process.env.ALGOD_SERVER || 'https://testnet-api.algonode.cloud',
  ''
);

const APP_ID = parseInt(process.env.ALGOSUB_APP_ID || '758847371');

/**
 * Get suggested transaction parameters
 */
async function getSuggestedParams() {
  return await algodClient.getTransactionParams().do();
}

/**
 * Execute a payment transaction
 * This is a placeholder - actual signing will happen on frontend with wallet
 * @param {Object} payment - Payment details
 * @returns {Promise<Object>} Transaction result
 */
export async function executePaymentWithContract({
  walletAddress,
  receiver,
  amount,
}) {
  try {
    // Get suggested params
    const suggestedParams = await getSuggestedParams();

    // Create payment transaction
    const paymentTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      from: walletAddress,
      to: receiver,
      amount: amount,
      suggestedParams,
    });

    // In production, this transaction would be:
    // 1. Sent to frontend
    // 2. Signed by user's wallet (Pera, Defly, etc.)
    // 3. Sent back to backend or directly to network

    return {
      txnId: paymentTxn.txID(),
      from: walletAddress,
      to: receiver,
      amount,
      amountInAlgo: amount / 1_000_000,
      status: 'pending_signature',
      message:
        'Transaction created. Please sign with your wallet to complete the payment.',
      unsignedTxn: Buffer.from(
        algosdk.encodeUnsignedTransaction(paymentTxn)
      ).toString('base64'),
    };
  } catch (error) {
    console.error('Error creating payment transaction:', error);
    throw new Error(`Failed to create payment: ${error.message}`);
  }
}

/**
 * Create a grouped transaction with smart contract validation
 * @param {Object} params - Transaction parameters
 * @returns {Promise<Object>} Grouped transaction
 */
export async function createValidatedPaymentGroup({
  walletAddress,
  receiver,
  amount,
}) {
  try {
    const suggestedParams = await getSuggestedParams();

    // Transaction 0: App call to validate_payment
    const appCallTxn = algosdk.makeApplicationNoOpTxnFromObject({
      from: walletAddress,
      appIndex: APP_ID,
      appArgs: [new Uint8Array(Buffer.from('validate_payment'))],
      suggestedParams,
    });

    // Transaction 1: Payment transaction
    const paymentTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      from: walletAddress,
      to: receiver,
      amount: amount,
      suggestedParams,
    });

    // Group transactions
    const txns = [appCallTxn, paymentTxn];
    const groupID = algosdk.computeGroupID(txns);

    txns.forEach((txn) => {
      txn.group = groupID;
    });

    return {
      groupId: Buffer.from(groupID).toString('base64'),
      transactions: txns.map((txn) => ({
        txnId: txn.txID(),
        unsignedTxn: Buffer.from(
          algosdk.encodeUnsignedTransaction(txn)
        ).toString('base64'),
      })),
      message:
        'Grouped transaction created. Sign both transactions with your wallet.',
    };
  } catch (error) {
    console.error('Error creating grouped transaction:', error);
    throw new Error(`Failed to create grouped transaction: ${error.message}`);
  }
}

/**
 * Get account information
 * @param {string} address - Algorand address
 * @returns {Promise<Object>} Account info
 */
export async function getAccountInfo(address) {
  try {
    const accountInfo = await algodClient.accountInformation(address).do();
    return {
      address: accountInfo.address,
      amount: accountInfo.amount,
      amountInAlgo: accountInfo.amount / 1_000_000,
      minBalance: accountInfo['min-balance'],
      round: accountInfo.round,
    };
  } catch (error) {
    console.error('Error fetching account info:', error);
    throw new Error(`Failed to get account info: ${error.message}`);
  }
}

/**
 * Get application information
 * @returns {Promise<Object>} App info
 */
export async function getAppInfo() {
  try {
    const appInfo = await algodClient.getApplicationByID(APP_ID).do();
    return {
      id: appInfo.id,
      creator: appInfo.params.creator,
      approvalProgram: appInfo.params['approval-program'],
      clearStateProgram: appInfo.params['clear-state-program'],
      globalState: appInfo.params['global-state'],
      localState: appInfo.params['local-state-schema'],
    };
  } catch (error) {
    console.error('Error fetching app info:', error);
    throw new Error(`Failed to get app info: ${error.message}`);
  }
}

/**
 * Create unsigned payment transaction for Pera Wallet signing
 * @param {Object} params - Payment parameters
 * @returns {Promise<Object>} Unsigned transaction
 */
export async function createUnsignedPayment({
  senderAddress,
  receiverAddress,
  amount,
  note = '',
}) {
  try {
    // Get suggested params
    const suggestedParams = await getSuggestedParams();

    // Create payment transaction
    const paymentTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      from: senderAddress,
      to: receiverAddress,
      amount: amount,
      note: note ? new Uint8Array(Buffer.from(note)) : undefined,
      suggestedParams,
    });

    return {
      txn: paymentTxn,
      txnBase64: Buffer.from(algosdk.encodeUnsignedTransaction(paymentTxn)).toString('base64'),
      from: senderAddress,
      to: receiverAddress,
      amount,
      amountInAlgo: amount / 1_000_000,
    };
  } catch (error) {
    console.error('Error creating unsigned payment:', error);
    throw new Error(`Failed to create payment transaction: ${error.message}`);
  }
}

/**
 * Submit signed transaction to network
 * @param {Uint8Array} signedTxn - Signed transaction
 * @returns {Promise<Object>} Transaction result
 */
export async function submitSignedTransaction(signedTxn) {
  try {
    // Send transaction
    const { txId } = await algodClient.sendRawTransaction(signedTxn).do();

    // Wait for confirmation
    const confirmedTxn = await algosdk.waitForConfirmation(algodClient, txId, 4);

    return {
      txId,
      confirmedRound: confirmedTxn['confirmed-round'],
      status: 'confirmed',
      message: 'Payment executed and confirmed successfully',
    };
  } catch (error) {
    console.error('Error submitting transaction:', error);
    throw new Error(`Failed to submit transaction: ${error.message}`);
  }
}

/**
 * Execute autonomous payment using mnemonic (for AI agent)
 * @param {Object} params - Payment parameters
 * @returns {Promise<Object>} Transaction result
 */
export async function executeAutonomousPayment({
  senderMnemonic,
  receiverAddress,
  amount,
  note = '',
}) {
  try {
    // Recover account from mnemonic
    const account = algosdk.mnemonicToSecretKey(senderMnemonic);
    
    // Get suggested params
    const suggestedParams = await getSuggestedParams();

    // Create payment transaction
    const paymentTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      from: account.addr,
      to: receiverAddress,
      amount: amount,
      note: note ? new Uint8Array(Buffer.from(note)) : undefined,
      suggestedParams,
    });

    // Sign transaction
    const signedTxn = paymentTxn.signTxn(account.sk);

    // Send transaction
    const { txId } = await algodClient.sendRawTransaction(signedTxn).do();

    // Wait for confirmation
    const confirmedTxn = await algosdk.waitForConfirmation(algodClient, txId, 4);

    return {
      txId,
      confirmedRound: confirmedTxn['confirmed-round'],
      from: account.addr,
      to: receiverAddress,
      amount,
      amountInAlgo: amount / 1_000_000,
      status: 'confirmed',
      message: 'Payment executed and confirmed successfully',
    };
  } catch (error) {
    console.error('Error executing autonomous payment:', error);
    throw new Error(`Failed to execute autonomous payment: ${error.message}`);
  }
}

/**
 * Test Algorand connection
 */
export async function testAlgorandConnection() {
  try {
    const status = await algodClient.status().do();
    return status !== null;
  } catch (error) {
    console.error('Algorand connection test failed:', error);
    return false;
  }
}
