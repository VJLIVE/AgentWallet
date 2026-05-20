'use client';

interface PaymentStatusProps {
  txHash?: string;
  status: 'idle' | 'pending' | 'confirmed';
}

export default function PaymentStatus({ txHash, status }: PaymentStatusProps) {
  const network = process.env.NEXT_PUBLIC_ALGORAND_NETWORK ?? 'testnet';
  const explorerBase = network === 'mainnet'
    ? 'https://allo.info/tx'
    : 'https://testnet.explorer.perawallet.app/tx';

  if (status === 'idle') {
    return (
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-amber-700/40 bg-amber-950/20">
        <span className="text-amber-400 text-lg">⚠</span>
        <div>
          <div className="text-amber-300 font-semibold text-sm">402 Payment Required</div>
          <div className="text-amber-500/70 text-xs">x402 protocol — USDC payment needed to access resource</div>
        </div>
      </div>
    );
  }

  if (status === 'pending') {
    return (
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-blue-700/40 bg-blue-950/20">
        <span className="text-blue-400 text-lg animate-spin inline-block">⟳</span>
        <div>
          <div className="text-blue-300 font-semibold text-sm">Settling on Algorand...</div>
          <div className="text-blue-500/70 text-xs">Broadcasting USDC ASA transfer via GoPlausible facilitator</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-emerald-500/40 bg-emerald-950/20">
      <span className="text-emerald-400 text-lg">✓</span>
      <div className="min-w-0">
        <div className="text-emerald-300 font-semibold text-sm">Confirmed on Algorand ✓</div>
        {txHash && (
          <a
            href={`${explorerBase}/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-600 text-xs font-mono hover:text-emerald-400 underline"
          >
            {txHash.slice(0, 16)}...{txHash.slice(-8)}
          </a>
        )}
      </div>
    </div>
  );
}
