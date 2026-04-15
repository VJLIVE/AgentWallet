'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { PeraWalletConnect } from '@perawallet/connect';
import toast from 'react-hot-toast';

interface WalletContextType {
  wallet: PeraWalletConnect | null;
  accountAddress: string | null;
  isConnected: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  signTransaction: (txn: any) => Promise<Uint8Array>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [wallet, setWallet] = useState<PeraWalletConnect | null>(null);
  const [accountAddress, setAccountAddress] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Initialize Pera Wallet
    const peraWallet = new PeraWalletConnect();
    setWallet(peraWallet);

    // Reconnect to session if exists
    peraWallet
      .reconnectSession()
      .then((accounts) => {
        if (accounts.length > 0) {
          setAccountAddress(accounts[0]);
          setIsConnected(true);
          toast.success('Wallet reconnected!');
        }
      })
      .catch((error) => {
        console.log('No previous session found');
      });

    // Listen for disconnect events
    peraWallet.connector?.on('disconnect', () => {
      setAccountAddress(null);
      setIsConnected(false);
      toast.error('Wallet disconnected');
    });
  }, []);

  const connect = async () => {
    if (!wallet) {
      toast.error('Wallet not initialized');
      return;
    }

    try {
      const accounts = await wallet.connect();
      setAccountAddress(accounts[0]);
      setIsConnected(true);
      toast.success('Wallet connected!');
    } catch (error: any) {
      console.error('Connection error:', error);
      if (error?.message?.includes('cancelled')) {
        toast.error('Connection cancelled');
      } else {
        toast.error('Failed to connect wallet');
      }
    }
  };

  const disconnect = async () => {
    if (!wallet) return;

    try {
      await wallet.disconnect();
      setAccountAddress(null);
      setIsConnected(false);
      toast.success('Wallet disconnected');
    } catch (error) {
      console.error('Disconnect error:', error);
      toast.error('Failed to disconnect wallet');
    }
  };

  const signTransaction = async (txn: any): Promise<Uint8Array> => {
    if (!wallet || !accountAddress) {
      throw new Error('Wallet not connected');
    }

    try {
      // algosdk v3: Pera Wallet expects [{ txn }] format
      const signedTxns = await wallet.signTransaction([[{ txn }]]);
      return signedTxns[0];
    } catch (error: any) {
      console.error('Signing error:', error);
      if (error?.message?.includes('cancelled')) {
        throw new Error('Transaction cancelled by user');
      }
      throw new Error('Failed to sign transaction');
    }
  };

  return (
    <WalletContext.Provider
      value={{
        wallet,
        accountAddress,
        isConnected,
        connect,
        disconnect,
        signTransaction,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}
