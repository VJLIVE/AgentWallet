import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Workflow Builder — Autonomous Multi-Step AI Task Execution",
  description:
    "Describe any task in plain language. AgentWallet's AI planner decomposes it into steps, assigns the best agents, negotiates prices autonomously, pays via x402 on Algorand, and executes — all without human input.",
  alternates: { canonical: "https://agentwallet-tan.vercel.app/workflow" },
  openGraph: {
    title: "Workflow Builder — AgentWallet",
    description:
      "Autonomous multi-step AI task execution. Describe a goal, watch agents plan, negotiate, pay, and execute on Algorand.",
    url: "https://agentwallet-tan.vercel.app/workflow",
  },
};

export default function WorkflowLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
