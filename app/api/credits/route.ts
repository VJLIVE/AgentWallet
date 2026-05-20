/**
 * API Route: /api/credits
 * Backend credit management - check balance, deduct credits
 *
 * Deduction rate: 1 USDC = 100 credits
 * So 0.02 USDC = 2 credits deducted
 */

import { NextRequest, NextResponse } from 'next/server';
import algosdk from 'algosdk';

const ALGOD_SERVER = 'https://testnet-api.algonode.cloud';
const ALGOD_PORT = 443;
const algodClient = new algosdk.Algodv2('', ALGOD_SERVER, ALGOD_PORT);

const CREDIT_CONTRACT_ID = parseInt(
  process.env.NEXT_PUBLIC_CREDIT_CONTRACT_ID || '762919965'
);

const CREDITS_PER_USDC = 100; // 1 USDC = 100 credits

function getAdminAccount() {
  const mnemonic = process.env.ADMIN_MNEMONIC;
  if (!mnemonic) throw new Error('ADMIN_MNEMONIC not set in environment');
  return algosdk.mnemonicToSecretKey(mnemonic);
}

/**
 * Get user's credit balance — algosdk v3 compatible
 */
async function getCreditBalance(userAddress: string): Promise<number> {
  try {
    const accountInfo = await algodClient
      .accountApplicationInformation(userAddress, CREDIT_CONTRACT_ID)
      .do();

    const localState = (accountInfo as any)?.appLocalState?.keyValue ?? [];

    if (!localState || !Array.isArray(localState)) return 0;

    const keyBytes = Array.from(Buffer.from('user_credits'));
    const entry = localState.find((kv: any) => {
      const k: number[] = Array.from(kv.key instanceof Uint8Array ? kv.key : kv.key);
      return k.length === keyBytes.length && k.every((b, i) => b === keyBytes[i]);
    });

    return entry ? Number(entry.value?.uint ?? 0) : 0;
  } catch (error: any) {
    if (error?.status === 404 || error?.message?.includes('application info not found')) return 0;
    console.error('Error getting credit balance:', error);
    return 0;
  }
}

/**
 * Deduct credits from user via on-chain transaction (admin signs)
 * amount = number of credits to deduct
 */
async function deductCredits(
  userAddress: string,
  amount: number
): Promise<{ success: boolean; txId?: string; error?: string }> {
  try {
    console.log(`[DEDUCT CREDITS] Starting deduction - User: ${userAddress}, Amount: ${amount}`);
    const adminAccount = getAdminAccount();
    console.log(`[DEDUCT CREDITS] Admin account: ${adminAccount.addr}`);
    
    const suggestedParams = await algodClient.getTransactionParams().do();
    
    // Increase fee to ensure transaction goes through
    suggestedParams.fee = BigInt(1000);
    suggestedParams.flatFee = true;

    // Build the method call - deduct_credits uses 'address' type, not 'account'
    // This means the address is passed as a 32-byte argument, not in the accounts array
    const abiMethod = algosdk.ABIMethod.fromSignature('deduct_credits(address,uint64)void');
    const methodSelector = abiMethod.getSelector();
    
    // Encode the user address as 32 bytes
    const userAddressBytes = algosdk.decodeAddress(userAddress).publicKey;
    
    // Encode the amount as uint64 (8 bytes, big-endian)
    const amountEncoded = new Uint8Array(8);
    const dataView = new DataView(amountEncoded.buffer);
    dataView.setBigUint64(0, BigInt(amount), false); // false = big-endian
    
    console.log('[DEDUCT CREDITS] Building transaction...');
    console.log(`  Method selector: ${Buffer.from(methodSelector).toString('hex')}`);
    console.log(`  User address: ${userAddress}`);
    console.log(`  User address bytes: ${Buffer.from(userAddressBytes).toString('hex')}`);
    console.log(`  Amount: ${amount}`);
    console.log(`  Admin address: ${adminAccount.addr}`);
    
    // Create the application call transaction
    // For 'address' type, pass the address bytes in appArgs
    // BUT also include it in accounts array so contract can access local state
    const appCallTxn = algosdk.makeApplicationNoOpTxnFromObject({
      sender: adminAccount.addr,
      appIndex: CREDIT_CONTRACT_ID,
      appArgs: [methodSelector, userAddressBytes, amountEncoded],
      accounts: [userAddress], // Needed for contract to access user's local state
      suggestedParams,
    });

    console.log('[DEDUCT CREDITS] Signing transaction with admin key...');
    const signedTxn = appCallTxn.signTxn(adminAccount.sk);
    
    console.log('[DEDUCT CREDITS] Sending transaction to network...');
    const sendResult = await algodClient.sendRawTransaction(signedTxn).do();
    const txId = sendResult.txid ?? '';
    
    console.log(`[DEDUCT CREDITS] Transaction sent - TxID: ${txId}`);
    console.log('[DEDUCT CREDITS] Waiting for confirmation...');
    
    await algosdk.waitForConfirmation(algodClient, txId, 4);
    
    console.log(`[DEDUCT CREDITS] ✅ Transaction confirmed - TxID: ${txId}`);
    return { success: true, txId };
  } catch (error: any) {
    console.error('[DEDUCT CREDITS] ❌ Error:', error);
    
    // Log more details about the error
    if (error.response) {
      console.error('[DEDUCT CREDITS] Response:', error.response);
    }
    if (error.message) {
      console.error('[DEDUCT CREDITS] Message:', error.message);
    }
    
    return { success: false, error: error.message || 'Failed to deduct credits' };
  }
}

// GET /api/credits?address=USER_ADDRESS
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');
    if (!address) return NextResponse.json({ error: 'Address parameter required' }, { status: 400 });

    const balance = await getCreditBalance(address);
    return NextResponse.json({
      address,
      credits: balance,
      usdcEquivalent: (balance / CREDITS_PER_USDC).toFixed(2),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch credits' }, { status: 500 });
  }
}

// POST /api/credits
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, address, amount, usdcAmount } = body;

    if (!address) return NextResponse.json({ error: 'Address required' }, { status: 400 });

    if (action === 'check') {
      // Check if user has sufficient credits for a given USDC amount
      const requiredCredits = usdcAmount != null
        ? Math.ceil(usdcAmount * CREDITS_PER_USDC)
        : (amount ?? 0);

      const balance = await getCreditBalance(address);
      return NextResponse.json({
        address,
        balance,
        requiredCredits,
        sufficient: balance >= requiredCredits,
        usdcEquivalent: (balance / CREDITS_PER_USDC).toFixed(2),
      });

    } else if (action === 'deduct') {
      // Deduct credits based on USDC amount spent
      // usdcAmount takes priority; falls back to raw credit amount
      const creditsToDeduct = usdcAmount != null
        ? Math.ceil(usdcAmount * CREDITS_PER_USDC)
        : (amount ?? 0);

      console.log(`[CREDITS API] Deduct request - Address: ${address}, USDC: ${usdcAmount}, Credits: ${creditsToDeduct}`);

      if (creditsToDeduct <= 0) {
        console.log('[CREDITS API] Deduct failed - amount must be positive');
        return NextResponse.json({ error: 'Amount must be positive' }, { status: 400 });
      }

      const balance = await getCreditBalance(address);
      console.log(`[CREDITS API] Current balance: ${balance}, Required: ${creditsToDeduct}`);
      
      if (balance < creditsToDeduct) {
        console.log(`[CREDITS API] Insufficient credits - Balance: ${balance}, Required: ${creditsToDeduct}`);
        return NextResponse.json(
          { error: 'Insufficient credits', balance, required: creditsToDeduct, shortfall: creditsToDeduct - balance },
          { status: 402 }
        );
      }

      console.log('[CREDITS API] Calling deductCredits on-chain...');
      const result = await deductCredits(address, creditsToDeduct);
      
      if (!result.success) {
        console.error('[CREDITS API] Deduction failed:', result.error);
        return NextResponse.json({ error: result.error || 'Failed to deduct credits' }, { status: 500 });
      }

      console.log(`[CREDITS API] ✅ Deduction successful - TxID: ${result.txId}`);
      return NextResponse.json({
        success: true,
        txId: result.txId,
        creditsDeducted: creditsToDeduct,
        usdcEquivalent: (creditsToDeduct / CREDITS_PER_USDC).toFixed(4),
        message: `Deducted ${creditsToDeduct} credits (${(creditsToDeduct / CREDITS_PER_USDC).toFixed(4)} USDC) from ${address}`,
      });

    } else {
      return NextResponse.json({ error: 'Invalid action. Use: check or deduct' }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to process credits' }, { status: 500 });
  }
}
