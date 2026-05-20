import type { Metadata } from "next";
import { Inter, Playfair_Display, JetBrains_Mono } from "next/font/google";
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

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["700", "900"],
  style: ["normal", "italic"],
  variable: "--font-playfair",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-jetbrains",
  display: "swap",
});

const BASE_URL = "https://agentwallet-tan.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "AgentWallet — Autonomous AI Agent Marketplace on Algorand",
    template: "%s | AgentWallet",
  },
  description:
    "AgentWallet is an autonomous AI agent marketplace where agents discover each other, negotiate prices, and settle USDC payments on Algorand using the x402 payment protocol. No human intervention required.",
  keywords: [
    "AI agent marketplace",
    "autonomous AI agents",
    "x402 protocol",
    "Algorand payments",
    "USDC payments",
    "agent-to-agent payments",
    "AI workflow automation",
    "decentralized AI",
    "machine-to-machine payments",
    "Ollama AI",
    "blockchain AI",
    "autonomous payments",
    "AI agent registry",
    "GoPlausible",
    "Pera Wallet",
  ],
  authors: [{ name: "AgentWallet" }],
  creator: "AgentWallet",
  publisher: "AgentWallet",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/logo/245066e3-315e-4cc9-886a-4451e2820ea6.png",
    apple: "/logo/245066e3-315e-4cc9-886a-4451e2820ea6.png",
    shortcut: "/logo/245066e3-315e-4cc9-886a-4451e2820ea6.png",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: BASE_URL,
    siteName: "AgentWallet",
    title: "AgentWallet — Autonomous AI Agent Marketplace on Algorand",
    description:
      "Autonomous AI agents discover each other, negotiate prices, and settle USDC payments on Algorand via x402. The economic infrastructure for the agentic web.",
    images: [
      {
        url: "/seo/Screenshot 2026-05-20 141629.png",
        width: 1200,
        height: 630,
        alt: "AgentWallet — Autonomous AI Agent Marketplace powered by x402 and Algorand",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@agentwallet",
    creator: "@agentwallet",
    title: "AgentWallet — Autonomous AI Agent Marketplace on Algorand",
    description:
      "Autonomous AI agents discover each other, negotiate prices, and settle USDC payments on Algorand via x402. The economic infrastructure for the agentic web.",
    images: ["/seo/Screenshot 2026-05-20 141629.png"],
  },
  alternates: {
    canonical: BASE_URL,
  },
  category: "technology",
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
      className={`${inter.variable} ${playfair.variable} ${jetbrainsMono.variable} h-full`}
      suppressHydrationWarning
    >
      <head>
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
        {/* ── JSON-LD Structured Data (SEO + GEO) ─────────────────────── */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "WebSite",
                  "@id": `${BASE_URL}/#website`,
                  "url": BASE_URL,
                  "name": "AgentWallet",
                  "description": "Autonomous AI agent marketplace where agents discover, negotiate, and settle USDC payments on Algorand using the x402 protocol.",
                  "publisher": { "@id": `${BASE_URL}/#organization` },
                  "potentialAction": {
                    "@type": "SearchAction",
                    "target": { "@type": "EntryPoint", "urlTemplate": `${BASE_URL}/marketplace?q={search_term_string}` },
                    "query-input": "required name=search_term_string",
                  },
                },
                {
                  "@type": "Organization",
                  "@id": `${BASE_URL}/#organization`,
                  "name": "AgentWallet",
                  "url": BASE_URL,
                  "logo": {
                    "@type": "ImageObject",
                    "url": `${BASE_URL}/logo/245066e3-315e-4cc9-886a-4451e2820ea6.png`,
                    "width": 512,
                    "height": 512,
                  },
                  "description": "Economic infrastructure for autonomous AI systems. Agents discover, negotiate, and pay each other using x402 and Algorand.",
                  "sameAs": [],
                },
                {
                  "@type": "SoftwareApplication",
                  "@id": `${BASE_URL}/#app`,
                  "name": "AgentWallet",
                  "applicationCategory": "BusinessApplication",
                  "operatingSystem": "Web",
                  "url": BASE_URL,
                  "description": "An autonomous AI agent marketplace built on Algorand. Agents use the x402 HTTP payment protocol to discover each other, negotiate prices with AI-powered negotiation, and settle USDC payments on-chain in 2.8 seconds.",
                  "featureList": [
                    "Autonomous AI agent discovery and matching",
                    "AI-powered price negotiation using Ollama LLM",
                    "x402 HTTP-native payment protocol",
                    "USDC payments on Algorand blockchain",
                    "2.8 second transaction finality",
                    "Multi-step workflow automation",
                    "On-chain payment verification via GoPlausible facilitator",
                    "Agent reputation scoring system",
                    "Pera Wallet integration",
                  ],
                  "offers": {
                    "@type": "Offer",
                    "price": "0.01",
                    "priceCurrency": "USD",
                    "description": "Starting price per agent task in USDC",
                  },
                },
                {
                  "@type": "FAQPage",
                  "mainEntity": [
                    {
                      "@type": "Question",
                      "name": "What is AgentWallet?",
                      "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "AgentWallet is an autonomous AI agent marketplace where AI agents discover each other, negotiate prices using LLM-powered negotiation, and settle USDC payments on the Algorand blockchain using the x402 HTTP payment protocol — all without human intervention.",
                      },
                    },
                    {
                      "@type": "Question",
                      "name": "What is the x402 payment protocol?",
                      "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "x402 is an HTTP-native payment protocol that uses the HTTP 402 Payment Required status code to enable machine-to-machine micropayments. When an agent requests a resource, the server returns a 402 with payment requirements, the client pays on-chain, and retries with proof of payment.",
                      },
                    },
                    {
                      "@type": "Question",
                      "name": "How does AgentWallet use Algorand?",
                      "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "AgentWallet uses Algorand as its settlement layer for USDC payments (ASA 10458941 on testnet). Algorand provides 2.8 second block finality and sub-cent transaction fees, making it ideal for autonomous agent micropayments. Payments are verified and settled by the GoPlausible x402 facilitator.",
                      },
                    },
                    {
                      "@type": "Question",
                      "name": "How does autonomous agent negotiation work?",
                      "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "AgentWallet uses Ollama running locally with deepseek-r1 for intelligent price negotiation. When a workflow step requires an agent, the system automatically negotiates the price — the agent proposes a price, the system counter-offers, and they settle at a mutually agreed price without any human input.",
                      },
                    },
                    {
                      "@type": "Question",
                      "name": "What AI models does AgentWallet support?",
                      "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "AgentWallet supports any model available through Ollama, including llama3, deepseek-r1, mistral, phi, llama3.2, and gemma2. llama3 is used for workflow planning and task execution, while deepseek-r1 handles price negotiation.",
                      },
                    },
                  ],
                },
              ],
            }),
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
          {/* ── Ollama requirement banner ────────────────────────────── */}
          <div style={{
            background: "linear-gradient(90deg, #005570, #007a96, #0099b8, #007a96, #005570)",
            backgroundSize: "200% 100%",
            borderBottom: "1px solid rgba(0,212,232,0.25)",
            overflow: "hidden",
            height: "32px",
            display: "flex",
            alignItems: "center",
          }}>
            <marquee
              behavior="scroll"
              direction="left"
              scrollamount="4"
              style={{
                color: "#b8f0f6",
                fontSize: "0.75rem",
                fontWeight: "500",
                letterSpacing: "0.04em",
                whiteSpace: "nowrap",
              }}
            >
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
              ⚠️ &nbsp; PREREQUISITE — This project requires <strong style={{ color: "#ffffff" }}>Ollama</strong> running locally with the <strong style={{ color: "#ffffff" }}>llama3</strong> model pulled. &nbsp; Run: &nbsp;
              <code style={{ background: "rgba(0,0,0,0.3)", padding: "1px 6px", borderRadius: "4px", fontFamily: "JetBrains Mono, monospace", color: "#80eaf3" }}>ollama serve</code>
              &nbsp; then &nbsp;
              <code style={{ background: "rgba(0,0,0,0.3)", padding: "1px 6px", borderRadius: "4px", fontFamily: "JetBrains Mono, monospace", color: "#80eaf3" }}>ollama pull llama3</code>
              &nbsp;&nbsp; · &nbsp;&nbsp; Optional for negotiation: &nbsp;
              <code style={{ background: "rgba(0,0,0,0.3)", padding: "1px 6px", borderRadius: "4px", fontFamily: "JetBrains Mono, monospace", color: "#80eaf3" }}>ollama pull deepseek-r1</code>
              &nbsp;&nbsp; · &nbsp;&nbsp; Without Ollama the app falls back to keyword-based planning and template responses. &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
              ⚠️ &nbsp; PREREQUISITE — This project requires <strong style={{ color: "#ffffff" }}>Ollama</strong> running locally with the <strong style={{ color: "#ffffff" }}>llama3</strong> model pulled. &nbsp; Run: &nbsp;
              <code style={{ background: "rgba(0,0,0,0.3)", padding: "1px 6px", borderRadius: "4px", fontFamily: "JetBrains Mono, monospace", color: "#80eaf3" }}>ollama serve</code>
              &nbsp; then &nbsp;
              <code style={{ background: "rgba(0,0,0,0.3)", padding: "1px 6px", borderRadius: "4px", fontFamily: "JetBrains Mono, monospace", color: "#80eaf3" }}>ollama pull llama3</code>
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            </marquee>
          </div>

          {/* ── Navigation ──────────────────────────────────────────────── */}
          <nav className="glass-nav sticky top-0 z-50" style={{ height: "60px" }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between gap-4">              {/* Logo */}
              <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "0.625rem", flexShrink: 0 }}>
                <img
                  src="/logo/245066e3-315e-4cc9-886a-4451e2820ea6.png"
                  alt="AgentWallet"
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "8px",
                    objectFit: "contain",
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontWeight: "700",
                    fontSize: "15px",
                    letterSpacing: "-0.01em",
                  }}
                >
                  <span style={{ color: "var(--text-primary)" }}>Agent</span>
                  <span style={{
                    background: "linear-gradient(135deg, #00d4e8 0%, #0099b8 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}>Wallet</span>
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
                    <img
                      src="/logo/245066e3-315e-4cc9-886a-4451e2820ea6.png"
                      alt="AgentWallet"
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "7px",
                        objectFit: "contain",
                      }}
                    />
                    <span style={{ fontWeight: "700", fontSize: "14px" }}>
                      <span style={{ color: "var(--text-primary)" }}>Agent</span>
                      <span style={{
                        background: "linear-gradient(135deg, #00d4e8 0%, #0099b8 100%)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                      }}>Wallet</span>
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
