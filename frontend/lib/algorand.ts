/**
 * Algorand utilities
 */
import algosdk from 'algosdk';

export const algodClient = new algosdk.Algodv2(
  process.env.NEXT_PUBLIC_ALGOD_TOKEN || '',
  process.env.NEXT_PUBLIC_ALGOD_SERVER || 'https://testnet-api.algonode.cloud',
  ''
);

export const APP_ID = parseInt(process.env.NEXT_PUBLIC_ALGOSUB_APP_ID || '758847371');

/**
 * Convert microAlgos to ALGO
 */
export function microAlgosToAlgo(microAlgos: number | bigint): number {
  const amount = typeof microAlgos === 'bigint' ? Number(microAlgos) : microAlgos;
  return amount / 1_000_000;
}

/**
 * Convert ALGO to microAlgos
 */
export function algoToMicroAlgos(algo: number): number {
  return Math.floor(algo * 1_000_000);
}

/**
 * Format address for display (truncate middle)
 */
export function formatAddress(address: string): string {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Get account balance
 */
export async function getAccountBalance(address: string): Promise<number> {
  try {
    const accountInfo = await algodClient.accountInformation(address).do();
    return accountInfo.amount;
  } catch (error) {
    console.error('Error fetching account balance:', error);
    return 0;
  }
}

/**
 * Wait for transaction confirmation
 */
export async function waitForConfirmation(txId: string): Promise<any> {
  const status = await algodClient.status().do();
  let lastRound = status['last-round'];

  while (true) {
    const pendingInfo = await algodClient.pendingTransactionInformation(txId).do();
    
    if (pendingInfo['confirmed-round'] !== null && pendingInfo['confirmed-round'] > 0) {
      return pendingInfo;
    }
    
    if (pendingInfo['pool-error'] != null && pendingInfo['pool-error'].length > 0) {
      throw new Error(`Transaction rejected: ${pendingInfo['pool-error']}`);
    }
    
    lastRound++;
    await algodClient.statusAfterBlock(lastRound).do();
  }
}
