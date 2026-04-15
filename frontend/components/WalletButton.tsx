'use client';

import { useWallet } from '@/contexts/WalletContext';
import { formatAddress } from '@/lib/algorand';
import { Wallet, LogOut, Loader2, Check } from 'lucide-react';
import { useState } from 'react';

export default function WalletButton() {
  const { accountAddress, isConnected, connect, disconnect } = useWallet();
  const [isLoading, setIsLoading] = useState(false);

  const handleConnect = async () => {
    setIsLoading(true);
    try {
      await connect();
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setIsLoading(true);
    try {
      await disconnect();
    } finally {
      setIsLoading(false);
    }
  };

  if (isConnected && accountAddress) {
    return (
      <div className="flex items-center gap-2">
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center justify-center w-5 h-5 bg-green-500 rounded-full">
            <Check className="w-3 h-3 text-white" strokeWidth={3} />
          </div>
          <span className="text-sm font-mono font-medium text-green-900">
            {formatAddress(accountAddress)}
          </span>
        </div>
        <button
          onClick={handleDisconnect}
          disabled={isLoading}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <LogOut className="w-4 h-4" />
          )}
          <span className="hidden sm:inline">Disconnect</span>
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleConnect}
      disabled={isLoading}
      className="enterprise-button-primary flex items-center gap-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Wallet className="w-4 h-4" />
      )}
      <span>Connect Wallet</span>
    </button>
  );
}
