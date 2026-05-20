import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // algosdk and @perawallet/connect use Node.js built-ins (crypto, buffer, etc.)
  // that must be treated as external on the server bundle.
  serverExternalPackages: [
    "algosdk",
    "@algorandfoundation/algokit-utils",
    "@x402/avm",
    "@x402/core",
    "@x402/fetch",
  ],
};

export default nextConfig;
