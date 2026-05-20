// Comprehensive test to check if deduct_credits method exists in the deployed contract
const algosdk = require('algosdk');

const ALGOD_SERVER = 'https://testnet-api.algonode.cloud';
const ALGOD_PORT = 443;
const algodClient = new algosdk.Algodv2('', ALGOD_SERVER, ALGOD_PORT);

const CREDIT_CONTRACT_ID = 762919965;

// Admin mnemonic from .env.local
const ADMIN_MNEMONIC = "match alert fox love pottery else accuse lesson cactus apology abuse sentence crowd echo mom absorb item mail inherit awesome zebra bulk usual absent eye";

// Test user address
const TEST_USER = "D73DJT6IVRGPG2QESM6UQUQUB5B3M4ZSTSCBQR2P4EP4TPQYH4ZBNDNL4Y";

async function testContractMethods() {
  console.log('=== Testing Contract Methods ===\n');
  
  try {
    const adminAccount = algosdk.mnemonicToSecretKey(ADMIN_MNEMONIC);
    console.log('Admin Address:', adminAccount.addr);
    
    // Get contract info
    const appInfo = await algodClient.getApplicationByID(CREDIT_CONTRACT_ID).do();
    console.log('Contract Creator:', appInfo.params.creator);
    
    // Check if admin matches creator
    if (adminAccount.addr === appInfo.params.creator) {
      console.log('✅ Admin account matches contract creator\n');
    } else {
      console.log('❌ WARNING: Admin account does NOT match contract creator\n');
    }
    
    // Get the approval program and check for method signatures
    const approvalProgram = Buffer.from(appInfo.params['approval-program'] || appInfo.params.approvalProgram, 'base64');
    console.log('Approval Program Size:', approvalProgram.length, 'bytes\n');
    
    // Search for method names in the program
    const methodNames = ['deduct_credits', 'buy_credits', 'opt_in', 'get_balance'];
    console.log('=== Searching for Methods in Bytecode ===');
    methodNames.forEach(name => {
      const found = approvalProgram.includes(Buffer.from(name));
      console.log(`${found ? '✅' : '❌'} ${name}: ${found ? 'FOUND' : 'NOT FOUND'}`);
    });
    
    console.log('\n=== Testing Method Selectors ===');
    
    // Test all possible method signatures for deduct_credits
    const testSignatures = [
      'deduct_credits(account,uint64)void',
      'deduct_credits(address,uint64)void', 
      'deduct_credits(uint64)void',
    ];
    
    for (const sig of testSignatures) {
      try {
        const method = algosdk.ABIMethod.fromSignature(sig);
        const selector = method.getSelector();
        console.log(`\n${sig}:`);
        console.log(`  Selector (hex): ${Buffer.from(selector).toString('hex')}`);
        console.log(`  Selector (base64): ${Buffer.from(selector).toString('base64')}`);
      } catch (err) {
        console.log(`\n${sig}: ERROR - ${err.message}`);
      }
    }
    
    // Check user's local state
    console.log('\n=== Checking User Local State ===');
    try {
      const accountInfo = await algodClient
        .accountApplicationInformation(TEST_USER, CREDIT_CONTRACT_ID)
        .do();
      
      const localState = accountInfo?.appLocalState?.keyValue || accountInfo?.['app-local-state']?.['key-value'] || [];
      
      if (localState.length === 0) {
        console.log('❌ User has NOT opted into the contract');
      } else {
        console.log('✅ User has opted in');
        localState.forEach(kv => {
          const key = Buffer.from(kv.key).toString();
          const value = kv.value?.uint || 0;
          console.log(`  ${key}: ${value}`);
        });
      }
    } catch (err) {
      console.log('❌ User has NOT opted into the contract');
    }
    
    // Try to simulate a deduct_credits call
    console.log('\n=== Attempting Dry-Run of deduct_credits ===');
    
    try {
      const suggestedParams = await algodClient.getTransactionParams().do();
      
      // Try with AtomicTransactionComposer
      const contract = new algosdk.ABIContract({
        name: 'CreditSystem',
        methods: [
          {
            name: 'deduct_credits',
            args: [
              { type: 'account', name: 'user' },
              { type: 'uint64', name: 'amount' }
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
      
      console.log('Transaction built successfully with ATC');
      console.log('Method selector:', Buffer.from(method.getSelector()).toString('hex'));
      
      // Try to send it
      console.log('\nAttempting to send transaction...');
      const result = await atc.execute(algodClient, 4);
      console.log('✅ SUCCESS! Transaction ID:', result.txIDs[0]);
      
    } catch (err) {
      console.log('❌ FAILED:', err.message);
      
      // If it's a logic error, the method might not exist
      if (err.message.includes('err opcode executed')) {
        console.log('\n⚠️  The contract rejected the transaction.');
        console.log('This likely means:');
        console.log('  1. The method signature is wrong');
        console.log('  2. The method does not exist in the deployed contract');
        console.log('  3. The contract was compiled without this method');
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testContractMethods();
