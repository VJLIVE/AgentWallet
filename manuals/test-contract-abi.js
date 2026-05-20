// Test script to fetch the contract ABI and test deduction
const algosdk = require('algosdk');

const ALGOD_SERVER = 'https://testnet-api.algonode.cloud';
const ALGOD_PORT = 443;
const algodClient = new algosdk.Algodv2('', ALGOD_SERVER, ALGOD_PORT);

const CREDIT_CONTRACT_ID = 762919965;

async function main() {
  try {
    console.log('Fetching contract info...');
    const appInfo = await algodClient.getApplicationByID(CREDIT_CONTRACT_ID).do();
    
    console.log('\n=== Contract Info ===');
    console.log('App ID:', CREDIT_CONTRACT_ID);
    console.log('Creator:', appInfo.params.creator);
    
    // Try to get the ABI from the contract's extra pages or approval program
    console.log('\n=== Global State ===');
    const globalState = appInfo.params.globalState || appInfo.params['global-state'] || [];
    globalState.forEach(kv => {
      const key = Buffer.from(kv.key, 'base64').toString();
      let value;
      if (kv.value.bytes) {
        const bytes = Buffer.from(kv.value.bytes, 'base64');
        try {
          value = algosdk.encodeAddress(bytes);
        } catch {
          value = bytes.toString('hex');
        }
      } else if (kv.value.uint !== undefined) {
        value = kv.value.uint;
      }
      console.log(`  ${key}: ${value}`);
    });

    // Test the method selector
    console.log('\n=== Testing Method Selectors ===');
    
    // Try different method signatures
    const signatures = [
      'deduct_credits(account,uint64)void',
      'deduct_credits(address,uint64)void',
      'deduct_credits(account,uint64)uint64',
    ];
    
    signatures.forEach(sig => {
      try {
        const method = algosdk.ABIMethod.fromSignature(sig);
        const selector = method.getSelector();
        console.log(`${sig}:`);
        console.log(`  Selector: ${Buffer.from(selector).toString('hex')}`);
      } catch (err) {
        console.log(`${sig}: ERROR - ${err.message}`);
      }
    });

    // Check if there's an ABI in the app's extra pages
    if (appInfo.params['extra-program-pages'] || appInfo.params.extraProgramPages) {
      console.log('\n=== Extra Program Pages ===');
      console.log('Contract has extra pages (might contain ABI)');
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

main();
