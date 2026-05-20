// Final test with the exact same approach as the backend
const algosdk = require('algosdk');

const ALGOD_SERVER = 'https://testnet-api.algonode.cloud';
const ALGOD_PORT = 443;
const algodClient = new algosdk.Algodv2('', ALGOD_SERVER, ALGOD_PORT);

const CREDIT_CONTRACT_ID = 762919965;
const ADMIN_MNEMONIC = "match alert fox love pottery else accuse lesson cactus apology abuse sentence crowd echo mom absorb item mail inherit awesome zebra bulk usual absent eye";
const TEST_USER = "D73DJT6IVRGPG2QESM6UQUQUB5B3M4ZSTSCBQR2P4EP4TPQYH4ZBNDNL4Y";

async function testFinalDeduct() {
  try {
    console.log('=== Final Deduct Credits Test ===\n');
    
    const adminAccount = algosdk.mnemonicToSecretKey(ADMIN_MNEMONIC);
    console.log('Admin:', adminAccount.addr);
    console.log('User:', TEST_USER);
    console.log('Amount: 2 credits\n');
    
    // Get user balance before
    const accountInfo = await algodClient
      .accountApplicationInformation(TEST_USER, CREDIT_CONTRACT_ID)
      .do();
    const localState = accountInfo?.appLocalState?.keyValue || [];
    const keyBytes = Array.from(Buffer.from('user_credits'));
    const entry = localState.find((kv) => {
      const k = Array.from(kv.key instanceof Uint8Array ? kv.key : kv.key);
      return k.length === keyBytes.length && k.every((b, i) => b === keyBytes[i]);
    });
    const balanceBefore = entry ? Number(entry.value?.uint ?? 0) : 0;
    console.log('Balance before:', balanceBefore);
    
    const suggestedParams = await algodClient.getTransactionParams().do();
    suggestedParams.fee = 1000;
    suggestedParams.flatFee = true;

    // Build the method call - use 'address' type, not 'account'
    const abiMethod = algosdk.ABIMethod.fromSignature('deduct_credits(address,uint64)void');
    const methodSelector = abiMethod.getSelector();
    
    // Encode user address as 32 bytes
    const userAddressBytes = algosdk.decodeAddress(TEST_USER).publicKey;
    
    // Encode amount
    const amountEncoded = new Uint8Array(8);
    const dataView = new DataView(amountEncoded.buffer);
    dataView.setBigUint64(0, BigInt(2), false);
    
    console.log('Method selector:', Buffer.from(methodSelector).toString('hex'));
    console.log('User address bytes:', Buffer.from(userAddressBytes).toString('hex'));
    console.log('Amount encoded:', Buffer.from(amountEncoded).toString('hex'));
    console.log('Admin address:', adminAccount.addr);
    
    // Create transaction - pass address as appArg AND in accounts array
    const appCallTxn = algosdk.makeApplicationNoOpTxnFromObject({
      sender: adminAccount.addr,
      appIndex: CREDIT_CONTRACT_ID,
      appArgs: [methodSelector, userAddressBytes, amountEncoded],
      accounts: [TEST_USER], // Needed for contract to access local state
      suggestedParams,
    });

    console.log('\nSigning and sending transaction...');
    const signedTxn = appCallTxn.signTxn(adminAccount.sk);
    const sendResult = await algodClient.sendRawTransaction(signedTxn).do();
    const txId = sendResult.txid || sendResult.txId;
    
    console.log('✅ Transaction sent!');
    console.log('TxID:', txId);
    console.log('Waiting for confirmation...');
    
    await algosdk.waitForConfirmation(algodClient, txId, 4);
    
    console.log('✅ Transaction confirmed!');
    
    // Get balance after
    const accountInfoAfter = await algodClient
      .accountApplicationInformation(TEST_USER, CREDIT_CONTRACT_ID)
      .do();
    const localStateAfter = accountInfoAfter?.appLocalState?.keyValue || [];
    const entryAfter = localStateAfter.find((kv) => {
      const k = Array.from(kv.key instanceof Uint8Array ? kv.key : kv.key);
      return k.length === keyBytes.length && k.every((b, i) => b === keyBytes[i]);
    });
    const balanceAfter = entryAfter ? Number(entryAfter.value?.uint ?? 0) : 0;
    
    console.log('\n=== Results ===');
    console.log('Balance before:', balanceBefore);
    console.log('Balance after:', balanceAfter);
    console.log('Deducted:', balanceBefore - balanceAfter);
    console.log('\n✅ SUCCESS! Credits deducted on-chain!');
    console.log(`View transaction: https://testnet.explorer.perawallet.app/tx/${txId}`);
    
  } catch (error) {
    console.error('\n❌ FAILED:', error.message);
    if (error.message.includes('err opcode')) {
      console.error('\nThe contract is still rejecting the transaction.');
      console.error('This means the deployed contract does not have the deduct_credits method.');
      console.error('The contract needs to be redeployed.');
    }
  }
}

testFinalDeduct();
