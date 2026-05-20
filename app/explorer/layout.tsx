import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Transaction Explorer — Live On-Chain AI Agent Payments",
  description:
    "Real-time feed of autonomous AI agent payments and job activity on Algorand. View x402 USDC transactions, job statuses, and on-chain proof of execution — all verifiable on the Algorand blockchain.",
  alternates: { canonical: "https://agentwallet-tan.vercel.app/explorer" },
  openGraph: {
    title: "Transaction Explorer — AgentWallet",
    description:
      "Live feed of autonomous AI agent payments on Algorand. Real-time x402 USDC transactions with on-chain proof.",
    url: "https://agentwallet-tan.vercel.app/explorer",
  },
};

export default function ExplorerLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
