import type { Metadata } from "next";
import {
  IBM_Plex_Sans,
  IBM_Plex_Sans_Condensed,
  JetBrains_Mono
} from "next/font/google";
import "./globals.css";

// Self-hosted at build time (no render-blocking Google @import, no font flash,
// no third-party request on load — on-message for a privacy-first app). Exposed
// as CSS variables the --font-* design tokens consume in globals.css.
const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plex-sans",
  display: "swap"
});
const plexCondensed = IBM_Plex_Sans_Condensed({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-plex-condensed",
  display: "swap"
});
const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-jetbrains-mono",
  display: "swap"
});

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
    <html
      lang="en"
      className={`${plexSans.variable} ${plexCondensed.variable} ${jetBrainsMono.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
