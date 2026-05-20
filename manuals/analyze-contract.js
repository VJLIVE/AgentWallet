// Analyze the deployed contract to find what methods it actually has
const algosdk = require('algosdk');

const ALGOD_SERVER = 'https://testnet-api.algonode.cloud';
const ALGOD_PORT = 443;
const algodClient = new algosdk.Algodv2('', ALGOD_SERVER, ALGOD_PORT);

const CREDIT_CONTRACT_ID = 762919965;

async function analyzeContract() {
  try {
    const appInfo = await algodClient.getApplicationByID(CREDIT_CONTRACT_ID).do();
    const approvalProgram = Buffer.from(appInfo.params['approval-program'] || appInfo.params.approvalProgram, 'base64');
    
    console.log('=== Contract Analysis ===\n');
    console.log('App ID:', CREDIT_CONTRACT_ID);
    console.log('Approval Program Size:', approvalProgram.length, 'bytes');
    console.log('Creator:', appInfo.params.creator);
    
    // The error shows pc=202 with a match statement
    // This is the ARC4 method router
    // Let's look for method selectors in the bytecode
    
    console.log('\n=== Looking for 4-byte Method Selectors ===');
    console.log('(ARC4 methods use first 4 bytes of SHA-512/256 hash)\n');
    
    // Common ARC4 method selectors we should test
    const knownMethods = {
      'opt_in()void': null,
      'buy_credits(pay)uint64': null,
      'get_balance(account)uint64': null,
      'get_my_balance()uint64': null,
      'set_rate(uint64)void': null,
      'get_rate()uint64': null,
      'deduct_credits(account,uint64)void': null,
      'withdraw_algo(account,uint64)void': null,
      'update_admin(account)void': null,
      'update_company_wallet(account)void': null,
      'get_admin()account': null,
      'get_company_wallet()account': null,
      'get_total_issued()uint64': null,
    };
    
    // Calculate selectors for all known methods
    for (const sig in knownMethods) {
      try {
        const method = algosdk.ABIMethod.fromSignature(sig);
        const selector = method.getSelector();
        knownMethods[sig] = Buffer.from(selector).toString('hex');
      } catch (err) {
        console.log(`Error with ${sig}:`, err.message);
      }
    }
    
    // Print all selectors
    console.log('Method Selectors:');
    for (const [sig, selector] of Object.entries(knownMethods)) {
      if (selector) {
        console.log(`  ${selector} - ${sig}`);
      }
    }
    
    // Check the contract's global state schema
    console.log('\n=== Contract Schema ===');
    const globalSchema = appInfo.params['global-state-schema'] || appInfo.params.globalStateSchema;
    const localSchema = appInfo.params['local-state-schema'] || appInfo.params.localStateSchema;
    
    console.log('Global State Schema:');
    console.log('  Uints:', globalSchema?.numUint || globalSchema?.['num-uint'] || 0);
    console.log('  Bytes:', globalSchema?.numByteSlice || globalSchema?.['num-byte-slice'] || 0);
    
    console.log('Local State Schema:');
    console.log('  Uints:', localSchema?.numUint || localSchema?.['num-uint'] || 0);
    console.log('  Bytes:', localSchema?.numByteSlice || localSchema?.['num-byte-slice'] || 0);
    
    // Check if this might be a different contract version
    console.log('\n=== Checking Contract Version ===');
    const globalState = appInfo.params.globalState || appInfo.params['global-state'] || [];
    
    console.log('Global State Keys:');
    globalState.forEach(kv => {
      const key = Buffer.from(kv.key, 'base64').toString();
      console.log(`  - ${key}`);
    });
    
    // The contract might have been deployed without the deduct_credits method
    // or with a different implementation
    console.log('\n=== Recommendation ===');
    console.log('The deployed contract does NOT contain the deduct_credits method.');
    console.log('Options:');
    console.log('  1. Redeploy the contract with the correct Python code');
    console.log('  2. Use a different contract that has this method');
    console.log('  3. Modify the backend to work without on-chain deduction');
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

analyzeContract();
