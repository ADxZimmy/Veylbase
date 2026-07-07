import type { Metadata } from "next";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://veylbase.vercel.app";
const description =
  "Choose a public ERC-20, shield it into an encrypted ERC-7984 balance, and reveal it only when you decide. Unshield back to public, 1:1.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Veylbase — Confidential Wrapper Registry",
    template: "%s · Veylbase"
  },
  description,
  applicationName: "Veylbase",
  keywords: [
    "Zama",
    "confidential tokens",
    "ERC-7984",
    "ERC-20",
    "FHE",
    "wrapper registry",
    "Sepolia"
  ],
  authors: [{ name: "Veylbase" }],
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon-48.png", sizes: "48x48", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" }
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180" }]
  },
  openGraph: {
    type: "website",
    siteName: "Veylbase",
    title: "Veylbase — Confidential Wrapper Registry",
    description,
    url: siteUrl,
    images: [
      {
        url: "/og.png",
        width: 1536,
        height: 807,
        alt: "Veylbase — the confidential wrapper registry for Zama."
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Veylbase — Confidential Wrapper Registry",
    description,
    images: ["/og.png"]
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
