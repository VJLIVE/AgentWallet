// Test calling deduct_credits using the exact ABI from Lora
const algosdk = require('algosdk');

const ALGOD_SERVER = 'https://testnet-api.algonode.cloud';
const ALGOD_PORT = 443;
const algodClient = new algosdk.Algodv2('', ALGOD_SERVER, ALGOD_PORT);

const CREDIT_CONTRACT_ID = 762919965;
const ADMIN_MNEMONIC = "match alert fox love pottery else accuse lesson cactus apology abuse sentence crowd echo mom absorb item mail inherit awesome zebra bulk usual absent eye";
const TEST_USER = "D73DJT6IVRGPG2QESM6UQUQUB5B3M4ZSTSCBQR2P4EP4TPQYH4ZBNDNL4Y";

async function testDeductWithLora() {
  try {
    console.log('=== Testing deduct_credits with Lora ABI ===\n');
    
    const adminAccount = algosdk.mnemonicToSecretKey(ADMIN_MNEMONIC);
    console.log('Admin:', adminAccount.addr);
    console.log('User:', TEST_USER);
    console.log('Amount to deduct: 2 credits\n');
    
    const suggestedParams = await algodClient.getTransactionParams().do();
    
    // Method 1: Try with manual encoding (old style)
    console.log('Method 1: Manual encoding...');
    try {
      const method = algosdk.ABIMethod.fromSignature('deduct_credits(account,uint64)void');
      const selector = method.getSelector();
      
      // Encode uint64 manually
      const amountBytes = new Uint8Array(8);
      new DataView(amountBytes.buffer).setBigUint64(0, BigInt(2), false);
      
      const txn = algosdk.makeApplicationNoOpTxnFromObject({
        sender: adminAccount.addr,
        appIndex: CREDIT_CONTRACT_ID,
        appArgs: [selector, amountBytes],
        accounts: [TEST_USER],
        suggestedParams,
      });
      
      const signedTxn = txn.signTxn(adminAccount.sk);
      const result = await algodClient.sendRawTransaction(signedTxn).do();
      const txId = result.txid || result.txId;
      
      console.log('✅ SUCCESS with manual encoding!');
      console.log('TxID:', txId);
      await algosdk.waitForConfirmation(algodClient, txId, 4);
      console.log('✅ Confirmed!\n');
      return;
      
    } catch (err) {
      console.log('❌ Failed:', err.message.substring(0, 150) + '...\n');
    }
    
    // Method 2: Try with ATC and proper ABI
    console.log('Method 2: AtomicTransactionComposer...');
    try {
      const contract = new algosdk.ABIContract({
        name: 'CreditSystem',
        methods: [
          {
            name: 'deduct_credits',
            desc: 'Deduct credits from user (admin only)',
            args: [
              { type: 'account', name: 'user', desc: 'User address to deduct from' },
              { type: 'uint64', name: 'amount', desc: 'Number of credits to deduct' }
            ],
            returns: { type: 'void' }
          }
        ]
      });
      
      const method = contract.getMethodByName('deduct_credits');
      const atc = new algosdk.AtomicTransactionComposer();
      
      atc.addMethodCall({
        appID: CREDIT_CONTRACT_ID,
        method: method,
        methodArgs: [TEST_USER, 2],
        sender: adminAccount.addr,
        signer: algosdk.makeBasicAccountTransactionSigner(adminAccount),
        suggestedParams,
      });
      
      const result = await atc.execute(algodClient, 4);
      console.log('✅ SUCCESS with ATC!');
      console.log('TxID:', result.txIDs[0]);
      console.log('✅ Confirmed!\n');
      return;
      
    } catch (err) {
      console.log('❌ Failed:', err.message.substring(0, 150) + '...\n');
    }
    
    // Method 3: Try calling without the account in accounts array (maybe it's encoded in args?)
    console.log('Method 3: Encoding account as argument...');
    try {
      const method = algosdk.ABIMethod.fromSignature('deduct_credits(account,uint64)void');
      const selector = method.getSelector();
      
      // Encode account address
      const userAddressBytes = algosdk.decodeAddress(TEST_USER).publicKey;
      
      // Encode uint64
      const amountBytes = new Uint8Array(8);
      new DataView(amountBytes.buffer).setBigUint64(0, BigInt(2), false);
      
      const txn = algosdk.makeApplicationNoOpTxnFromObject({
        sender: adminAccount.addr,
        appIndex: CREDIT_CONTRACT_ID,
        appArgs: [selector, userAddressBytes, amountBytes],
        suggestedParams,
      });
      
      const signedTxn = txn.signTxn(adminAccount.sk);
      const result = await algodClient.sendRawTransaction(signedTxn).do();
      const txId = result.txid || result.txId;
      
      console.log('✅ SUCCESS with encoded account!');
      console.log('TxID:', txId);
      await algosdk.waitForConfirmation(algodClient, txId, 4);
      console.log('✅ Confirmed!\n');
      return;
      
    } catch (err) {
      console.log('❌ Failed:', err.message.substring(0, 150) + '...\n');
    }
    
    console.log('All methods failed. The contract might need to be checked in Lora.');
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testDeductWithLora();
