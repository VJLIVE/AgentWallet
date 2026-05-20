/**
 * API Route: /api/credits
 * Backend credit management - check balance, deduct credits
 */

import { NextRequest, NextResponse } from 'next/server';
import algosdk from 'algosdk';

const ALGOD_SERVER = 'https://testnet-api.algonode.cloud';
const ALGOD_PORT = 443;
const algodClient = new algosdk.Algodv2('', ALGOD_SERVER, ALGOD_PORT);

const CREDIT_CONTRACT_ID = parseInt(
  process.env.NEXT_PUBLIC_CREDIT_CONTRACT_ID || '762919965'
);

/**
 * Get admin account from mnemonic
 */
function getAdminAccount() {
  const mnemonic = process.env.ADMIN_MNEMONIC;
  if (!mnemonic) {
    throw new Error('ADMIN_MNEMONIC not set in environment');
  }
  return algosdk.mnemonicToSecretKey(mnemonic);
}

/**
 * Get user's credit balance
 */
async function getCreditBalance(userAddress: string): Promise<number> {
  try {
    const accountInfo = await algodClient
      .accountApplicationInformation(userAddress, CREDIT_CONTRACT_ID)
      .do();

    const localState = accountInfo['app-local-state']['key-value'];
    const creditsKey = Buffer.from('user_credits').toString('base64');
    const creditsValue = localState.find((kv: any) => kv.key === creditsKey);

    return creditsValue ? creditsValue.value.uint : 0;
  } catch (error: any) {
    // If user hasn't opted in, return 0
    if (error?.status === 404 || error?.message?.includes('application info not found')) {
      return 0;
    }
    console.error('Error getting credit balance:', error);
    return 0;
  }
}

/**
 * Check if user has sufficient credits
 */
async function hasSufficientCredits(
  userAddress: string,
  requiredAmount: number
): Promise<boolean> {
  const balance = await getCreditBalance(userAddress);
  return balance >= requiredAmount;
}

/**
 * Deduct credits from user (admin only)
 */
async function deductCredits(
  userAddress: string,
  amount: number
): Promise<{ success: boolean; txId?: string; error?: string }> {
  try {
    const adminAccount = getAdminAccount();
    const suggestedParams = await algodClient.getTransactionParams().do();

    // Create app call transaction to deduct credits
    const appCallTxn = algosdk.makeApplicationNoOpTxnFromObject({
      sender: adminAccount.addr,
      appIndex: CREDIT_CONTRACT_ID,
      appArgs: [
        new Uint8Array(Buffer.from('deduct_credits')),
        algosdk.encodeUint64(amount),
      ],
      accounts: [userAddress], // User address as foreign account
      suggestedParams,
    });

    // Sign transaction
    const signedTxn = appCallTxn.signTxn(adminAccount.sk);

    // Send transaction
    const { txId } = await algodClient.sendRawTransaction(signedTxn).do();

    // Wait for confirmation
    await algosdk.waitForConfirmation(algodClient, txId, 4);

    return { success: true, txId };
  } catch (error: any) {
    console.error('Error deducting credits:', error);
    return {
      success: false,
      error: error.message || 'Failed to deduct credits',
    };
  }
}

// GET /api/credits?address=USER_ADDRESS
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');

    if (!address) {
      return NextResponse.json(
        { error: 'Address parameter required' },
        { status: 400 }
      );
    }

    const balance = await getCreditBalance(address);

    return NextResponse.json({
      address,
      credits: balance,
      usdcEquivalent: (balance / 100).toFixed(2),
    });
  } catch (error: any) {
    console.error('Error fetching credits:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch credits' },
      { status: 500 }
    );
  }
}

// POST /api/credits
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, address, amount } = body;

    if (!address) {
      return NextResponse.json(
        { error: 'Address required' },
        { status: 400 }
      );
    }

    if (action === 'check') {
      // Check if user has sufficient credits
      if (!amount) {
        return NextResponse.json(
          { error: 'Amount required for check action' },
          { status: 400 }
        );
      }

      const sufficient = await hasSufficientCredits(address, amount);
      const balance = await getCreditBalance(address);

      return NextResponse.json({
        address,
        balance,
        requiredAmount: amount,
        sufficient,
      });
    } else if (action === 'deduct') {
      // Deduct credits from user
      if (!amount) {
        return NextResponse.json(
          { error: 'Amount required for deduct action' },
          { status: 400 }
        );
      }

      // Check if user has sufficient credits
      const sufficient = await hasSufficientCredits(address, amount);

      if (!sufficient) {
        const balance = await getCreditBalance(address);
        return NextResponse.json(
          {
            error: 'Insufficient credits',
            balance,
            required: amount,
            shortfall: amount - balance,
          },
          { status: 402 } // Payment Required
        );
      }

      // Deduct credits
      const result = await deductCredits(address, amount);

      if (!result.success) {
        return NextResponse.json(
          { error: result.error || 'Failed to deduct credits' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        txId: result.txId,
        amountDeducted: amount,
        message: `Deducted ${amount} credits from ${address}`,
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use: check or deduct' },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Error processing credits:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process credits' },
      { status: 500 }
    );
  }
}
