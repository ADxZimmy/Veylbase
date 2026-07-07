import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: true,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Clickjacking protection for a wallet-facing app. frame-ancestors is
          // the modern control; X-Frame-Options covers older agents. Only the
          // framing directive is set, so it can't break SDK/CDN/wallet requests.
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'none'" }
          // Do not add COOP/COEP here. The Zama SDK runs on the single-threaded
          // web() path, and cross-origin isolation can block CDN runtime fetches
          // or wallet popups.
        ]
      }
    ];
  }
};

export default nextConfig;
