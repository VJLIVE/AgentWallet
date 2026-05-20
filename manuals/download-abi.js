// Try to get the actual ABI from the contract or reconstruct it
const algosdk = require('algosdk');
const https = require('https');

const CREDIT_CONTRACT_ID = 762919965;

// Try to fetch from Lora's API if available
async function tryLoraAPI() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.lora.algokit.io',
      path: `/v1/application/${CREDIT_CONTRACT_ID}`,
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`Status ${res.statusCode}`));
        }
      });
    });
    
    req.on('error', reject);
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Timeout'));
    });
    req.end();
  });
}

async function main() {
  console.log('=== Attempting to fetch ABI from Lora ===\n');
  
  try {
    const data = await tryLoraAPI();
    console.log('✅ Got data from Lora API!');
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.log('❌ Could not fetch from Lora API:', err.message);
    console.log('\nPlease manually export the ABI from Lora:');
    console.log('1. Go to https://lora.algokit.io/testnet/application/762919965');
    console.log('2. Look for an "Export ABI" or "Download ABI" button');
    console.log('3. Save the ABI JSON file');
    console.log('4. Place it in the project as contracts/credit_system.arc32.json');
  }
  
  // Alternative: construct the ABI based on what we know
  console.log('\n=== Constructing ABI from known methods ===\n');
  
  const constructedABI = {
    name: 'CreditSystem',
    desc: 'AgentWallet Credit System Smart Contract',
    methods: [
      {
        name: 'create',
        args: [],
        returns: { type: 'void' }
      },
      {
        name: 'opt_in',
        args: [],
        returns: { type: 'void' }
      },
      {
        name: 'buy_credits',
        args: [{ type: 'pay', name: 'payment' }],
        returns: { type: 'uint64' }
      },
      {
        name: 'deduct_credits',
        args: [
          { type: 'account', name: 'user' },
          { type: 'uint64', name: 'amount' }
        ],
        returns: { type: 'void' }
      },
      {
        name: 'get_balance',
        args: [{ type: 'account', name: 'user' }],
        returns: { type: 'uint64' }
      },
      {
        name: 'get_my_balance',
        args: [],
        returns: { type: 'uint64' }
      },
      {
        name: 'set_rate',
        args: [{ type: 'uint64', name: 'new_rate' }],
        returns: { type: 'void' }
      },
      {
        name: 'get_rate',
        args: [],
        returns: { type: 'uint64' }
      },
      {
        name: 'get_total_issued',
        args: [],
        returns: { type: 'uint64' }
      },
      {
        name: 'withdraw_algo',
        args: [
          { type: 'account', name: 'receiver' },
          { type: 'uint64', name: 'amount' }
        ],
        returns: { type: 'void' }
      },
      {
        name: 'update_admin',
        args: [{ type: 'account', name: 'new_admin' }],
        returns: { type: 'void' }
      },
      {
        name: 'update_company_wallet',
        args: [{ type: 'account', name: 'new_wallet' }],
        returns: { type: 'void' }
      }
    ]
  };
  
  console.log('Constructed ABI:');
  console.log(JSON.stringify(constructedABI, null, 2));
  
  // Calculate method selectors
  console.log('\n=== Method Selectors ===');
  constructedABI.methods.forEach(m => {
    const argTypes = m.args.map(a => a.type).join(',');
    const sig = `${m.name}(${argTypes})${m.returns.type}`;
    try {
      const method = algosdk.ABIMethod.fromSignature(sig);
      const selector = Buffer.from(method.getSelector()).toString('hex');
      console.log(`${selector} - ${sig}`);
    } catch (err) {
      console.log(`ERROR - ${sig}: ${err.message}`);
    }
  });
}

main();
