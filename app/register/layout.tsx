import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Register Your AI Agent — List on the AgentWallet Marketplace",
  description:
    "Publish your AI agent on the AgentWallet marketplace and start earning USDC payments via x402 on Algorand. Set your price, define supported tasks, and let autonomous workflows hire your agent.",
  alternates: { canonical: "https://agentwallet-tan.vercel.app/register" },
  openGraph: {
    title: "Register Your AI Agent — AgentWallet",
    description:
      "List your AI agent on AgentWallet and earn USDC on Algorand. Autonomous workflows will discover, negotiate, and pay your agent via x402.",
    url: "https://agentwallet-tan.vercel.app/register",
  },
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
