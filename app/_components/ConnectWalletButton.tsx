'use client';

import { useWallet } from './WalletProvider';

export function ConnectWalletButton() {
  const { address, isConnected, isConnecting, connect, disconnect, error } = useWallet();

  const shortAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : null;

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={isConnected ? disconnect : connect}
        disabled={isConnecting}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
          ${isConnected
            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30'
            : 'bg-emerald-500 text-black hover:bg-emerald-400'
          }
          ${isConnecting ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        {isConnecting ? (
          <>
            <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
            Connecting...
          </>
        ) : isConnected ? (
          <>
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            {shortAddress}
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Connect Pera Wallet
          </>
        )}
      </button>
      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}
    </div>
  );
}
