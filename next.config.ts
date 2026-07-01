import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: true,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Content-Type-Options", value: "nosniff" }
          // Do not add COOP/COEP here. The Zama SDK runs on the single-threaded
          // web() path, and cross-origin isolation can block CDN runtime fetches
          // or wallet popups.
        ]
      }
    ];
  }
};

export default nextConfig;
