import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import { WalletProvider } from "./_components/WalletProvider";
import { ConnectWalletButton } from "./_components/ConnectWalletButton";
import { ThemeToggle } from "./_components/ThemeToggle";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AgentWallet — Autonomous AI Marketplace",
  description:
    "Economic infrastructure for autonomous AI systems. Agents discover, negotiate, and pay each other using x402 and Algorand.",
  keywords: ["AI agents", "x402", "Algorand", "USDC", "autonomous payments", "marketplace"],
};

const NAV_LINKS = [
  { href: "/marketplace", label: "Marketplace" },
  { href: "/workflow", label: "Workflow" },
  { href: "/explorer", label: "Explorer" },
  { href: "/register", label: "List Agent" },
];

const FOOTER_PLATFORM = [
  { href: "/marketplace", label: "Marketplace" },
  { href: "/workflow", label: "Workflow Builder" },
  { href: "/explorer", label: "Explorer" },
  { href: "/register", label: "List Agent" },
];

const FOOTER_TECH = [
  { href: "https://docs.x402.org", label: "x402 Protocol" },
  { href: "https://developer.algorand.org", label: "Algorand" },
  { href: "https://facilitator.goplausible.xyz/docs", label: "GoPlausible" },
  { href: "https://ollama.ai", label: "Ollama AI" },
];

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      data-theme="dark"
      className={`${inter.variable} h-full`}
      suppressHydrationWarning
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700;1,900&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var t = localStorage.getItem('aw-theme');
                  if (!t) {
                    t = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
                  }
                  document.documentElement.setAttribute('data-theme', t);
                } catch(e) {}
              })();
            `,
          }}
        />
        <style>{`
          .nav-link {
            padding: 0.375rem 0.875rem;
            border-radius: 9999px;
            font-size: 0.8125rem;
            font-weight: 500;
            color: var(--text-secondary);
            text-decoration: none;
            transition: all 0.15s ease;
          }
          .nav-link:hover {
            background: var(--bg-elevated);
            color: var(--text-primary);
          }
          .footer-link {
            font-size: 0.8125rem;
            color: var(--text-secondary);
            text-decoration: none;
            transition: color 0.15s;
            display: block;
            margin-bottom: 0.5rem;
          }
          .footer-link:hover { color: var(--text-primary); }
        `}</style>
      </head>
      <body
        className="min-h-full flex flex-col transition-theme"
        style={{ background: "var(--bg-base)", color: "var(--text-primary)" }}
      >
        <WalletProvider>
          {/* ── Navigation ──────────────────────────────────────────────── */}
          <nav className="glass-nav sticky top-0 z-50" style={{ height: "60px" }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between gap-4">
              {/* Logo */}
              <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "0.625rem", flexShrink: 0 }}>
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "8px",
                    background: "var(--text-primary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--bg-base)",
                    fontSize: "15px",
                    fontWeight: "700",
                    flexShrink: 0,
                  }}
                >
                  ⚡
                </div>
                <span
                  style={{
                    fontWeight: "700",
                    fontSize: "15px",
                    color: "var(--text-primary)",
                    letterSpacing: "-0.01em",
                  }}
                >
                  AgentWallet
                </span>
              </Link>

              {/* Center nav links */}
              <div className="hidden md:flex items-center gap-1">
                {NAV_LINKS.map((link) => (
                  <Link key={link.href} href={link.href} className="nav-link focus-ring">
                    {link.label}
                  </Link>
                ))}
              </div>

              {/* Right actions */}
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <ConnectWalletButton />
              </div>
            </div>
          </nav>

          {/* ── Main ─────────────────────────────────────────────────────── */}
          <main className="flex-1 flex flex-col">{children}</main>

          {/* ── Footer ───────────────────────────────────────────────────── */}
          <footer style={{ borderTop: "1px solid var(--border-subtle)", background: "var(--bg-surface)" }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
                {/* Brand */}
                <div className="col-span-2 md:col-span-1">
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                    <div
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "7px",
                        background: "var(--text-primary)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "var(--bg-base)",
                        fontSize: "13px",
                      }}
                    >
                      ⚡
                    </div>
                    <span style={{ fontWeight: "700", fontSize: "14px", color: "var(--text-primary)" }}>
                      AgentWallet
                    </span>
                  </div>
                  <p style={{ fontSize: "0.8125rem", color: "var(--text-tertiary)", lineHeight: "1.6", maxWidth: "220px" }}>
                    Economic infrastructure for autonomous AI systems on Algorand.
                  </p>
                </div>

                {/* Platform */}
                <div>
                  <div className="section-label" style={{ marginBottom: "0.75rem" }}>Platform</div>
                  {FOOTER_PLATFORM.map((l) => (
                    <Link key={l.href} href={l.href} className="footer-link">{l.label}</Link>
                  ))}
                </div>

                {/* Technology */}
                <div>
                  <div className="section-label" style={{ marginBottom: "0.75rem" }}>Technology</div>
                  {FOOTER_TECH.map((l) => (
                    <a key={l.href} href={l.href} target="_blank" rel="noopener noreferrer" className="footer-link">
                      {l.label} ↗
                    </a>
                  ))}
                </div>

                {/* Network */}
                <div>
                  <div className="section-label" style={{ marginBottom: "0.75rem" }}>Network</div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                    <span className="live-dot" />
                    <span style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
                      Algorand Testnet
                    </span>
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontFamily: "JetBrains Mono, monospace", lineHeight: "1.7" }}>
                    USDC ASA 10458941<br />
                    x402 · GoPlausible<br />
                    2.8s finality
                  </div>
                </div>
              </div>

              <div
                style={{
                  borderTop: "1px solid var(--border-subtle)",
                  paddingTop: "1.5rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "0.5rem",
                }}
              >
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  © 2025 AgentWallet. Built for the Algorand x402 hackathon.
                </span>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  Not financial advice · Testnet only
                </span>
              </div>
            </div>
          </footer>
        </WalletProvider>
      </body>
    </html>
  );
}
