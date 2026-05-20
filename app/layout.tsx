import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { WalletProvider } from "./_components/WalletProvider";
import { ConnectWalletButton } from "./_components/ConnectWalletButton";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AgentWallet — Autonomous AI Marketplace",
  description:
    "Economic infrastructure for autonomous AI systems. Agents discover, negotiate, and pay each other using x402 and Algorand.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-zinc-950 text-zinc-100">
        <WalletProvider>
          <nav className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-14">
                <Link
                  href="/"
                  className="flex items-center gap-2 font-bold text-lg text-zinc-100 hover:text-emerald-400 transition-colors"
                >
                  <span className="text-emerald-400">⚡</span>
                  <span>AgentWallet</span>
                </Link>
                <div className="flex items-center gap-1">
                  <Link
                    href="/marketplace"
                    className="px-3 py-1.5 text-sm text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition-colors"
                  >
                    Marketplace
                  </Link>
                  <Link
                    href="/workflow"
                    className="px-3 py-1.5 text-sm text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition-colors"
                  >
                    Workflow Builder
                  </Link>
                  <Link
                    href="/explorer"
                    className="px-3 py-1.5 text-sm text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition-colors"
                  >
                    Explorer
                  </Link>
                  <Link
                    href="/register"
                    className="px-3 py-1.5 text-sm text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition-colors"
                  >
                    Register Agent
                  </Link>
                  <div className="ml-2">
                    <ConnectWalletButton />
                  </div>
                </div>
              </div>
            </div>
          </nav>
          <main className="flex-1 flex flex-col">{children}</main>
          <footer className="border-t border-zinc-800 py-6 text-center text-zinc-600 text-sm">
            AgentWallet — x402 on Algorand ·{" "}
            <a
              href="https://docs.x402.org"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-zinc-400 transition-colors"
            >
              x402 docs
            </a>{" "}
            ·{" "}
            <a
              href="https://developer.algorand.org"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-zinc-400 transition-colors"
            >
              Algorand
            </a>
          </footer>
        </WalletProvider>
      </body>
    </html>
  );
}
