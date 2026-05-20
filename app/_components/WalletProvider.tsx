'use client';

/**
 * WalletProvider — manages Pera Wallet connection state globally.
 *
 * Uses @perawallet/connect for real Algorand wallet integration.
 * PeraWalletConnect must be instantiated outside the component to persist
 * across renders (as per Pera docs).
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { PeraWalletConnect } from '@perawallet/connect';

// Singleton — must live outside component
let peraWallet: PeraWalletConnect | null = null;

function getPeraWallet(): PeraWalletConnect {
  if (!peraWallet) {
    peraWallet = new PeraWalletConnect({
      shouldShowSignTxnToast: true,
      // chainId 416002 = Algorand TestNet
      chainId: (process.env.NEXT_PUBLIC_ALGORAND_NETWORK === 'mainnet' ? 416001 : 416002) as 416001 | 416002,
    });
  }
  return peraWallet;
}

interface WalletContextValue {
  address: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  signTransactions: (txns: Uint8Array[], indexesToSign: number[]) => Promise<Uint8Array[]>;
  error: string | null;
}

const WalletContext = createContext<WalletContextValue>({
  address: null,
  isConnected: false,
  isConnecting: false,
  connect: async () => {},
  disconnect: () => {},
  signTransactions: async () => [],
  error: null,
});

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDisconnect = useCallback(() => {
    setAddress(null);
    setError(null);
  }, []);

  // Reconnect existing session on mount
  useEffect(() => {
    const wallet = getPeraWallet();
    wallet
      .reconnectSession()
      .then(accounts => {
        wallet.connector?.on('disconnect', handleDisconnect);
        if (wallet.isConnected && accounts.length > 0) {
          setAddress(accounts[0]);
        }
      })
      .catch(err => {
        console.warn('Pera reconnect failed:', err);
      });
  }, [handleDisconnect]);

  const connect = useCallback(async () => {
    setIsConnecting(true);
    setError(null);
    const wallet = getPeraWallet();

    try {
      const accounts = await wallet.connect();
      wallet.connector?.on('disconnect', handleDisconnect);
      setAddress(accounts[0]);
    } catch (err: unknown) {
      const e = err as { data?: { type?: string }; message?: string };
      if (e?.data?.type !== 'CONNECT_MODAL_CLOSED') {
        setError(e?.message ?? 'Failed to connect wallet');
      }
    } finally {
      setIsConnecting(false);
    }
  }, [handleDisconnect]);

  const disconnect = useCallback(() => {
    const wallet = getPeraWallet();
    wallet.disconnect().catch(console.warn);
    handleDisconnect();
  }, [handleDisconnect]);

  const signTransactions = useCallback(
    async (txns: Uint8Array[], indexesToSign: number[]): Promise<Uint8Array[]> => {
      const wallet = getPeraWallet();
      if (!address) throw new Error('Wallet not connected');

      const signerTxns = txns.map((txn, i) => ({
        txn: txn as unknown as import('algosdk').Transaction,
        signers: indexesToSign.includes(i) ? [address] : [],
      }));

      // signTransaction returns Uint8Array[] — one signed blob per transaction
      return wallet.signTransaction([signerTxns]);
    },
    [address]
  );

  return (
    <WalletContext.Provider
      value={{
        address,
        isConnected: !!address,
        isConnecting,
        connect,
        disconnect,
        signTransactions,
        error,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  return useContext(WalletContext);
}
