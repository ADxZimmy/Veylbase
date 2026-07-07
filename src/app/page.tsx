import Link from "next/link";
import { ArrowRight, ExternalLink, Lock, Shield } from "lucide-react";
import { BrandMark } from "./brand-mark";
import {
  etherscanAddressUrl,
  SEPOLIA_CHAIN,
  ZAMA_WRAPPER_REGISTRY_DOC_URL
} from "@/lib/chains";

const footerLinks = [
  { label: "GitHub", href: "https://github.com/ADxZimmy/Veylbase" },
  {
    label: "Registry contract",
    href: etherscanAddressUrl(SEPOLIA_CHAIN.registryAddress)
  },
  { label: "Zama docs", href: ZAMA_WRAPPER_REGISTRY_DOC_URL }
];

const flowSteps = [
  {
    idx: "01",
    title: "Choose an asset",
    desc: "Pick a public token with a Zama wrapper pair on Sepolia."
  },
  {
    idx: "02",
    title: "Shield",
    desc: "Wrap the public balance into an encrypted, confidential one."
  },
  {
    idx: "03",
    title: "Reveal",
    desc: "Decrypt your balance with a signature. Nothing is broadcast."
  },
  {
    idx: "04",
    title: "Unshield",
    desc: "Return to the public token whenever you choose, 1:1."
  }
];

const valueRows = [
  { label: "Shielded balances", value: "Encrypted on-chain" },
  { label: "Revealing", value: "A signature only you hold" },
  { label: "Unshielding", value: "Returns the public token 1:1" }
];

const maskedRows = [
  { name: "cWETHMock", widths: [26, 14, 34, 20] },
  { name: "cZAMAMock", widths: [18, 32, 16, 26] },
  { name: "ctGBP", widths: [30, 18, 24, 14] }
];

export default function Home() {
  return (
    <main className="vb-landing">
      <header className="vb-landing-nav" aria-label="Veylbase">
        <Link className="vb-brand vb-brand--lg" href="#top">
          <BrandMark size={34} className="vb-brand-mark" />
          <span className="vb-brand-name">
            <strong>VEYLBASE</strong>
            <small>CONFIDENTIAL WRAPPER REGISTRY</small>
          </span>
        </Link>
        <Link className="vb-enter" href="/app">
          Enter dApp
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </header>

      <section id="top" className="vb-hero">
        <div className="vb-hero-copy">
          <div className="vb-eyebrow-row">
            <span className="vb-eyebrow-square" aria-hidden="true" />
            <span className="vb-eyebrow-text">
              The confidential wrapper registry for Zama
            </span>
          </div>
          <h1>
            <span className="vb-hero-word">
              Private
              <span className="vb-unredact" aria-hidden="true" />
            </span>{" "}
            balances
            <br />
            for public tokens.
          </h1>
          <p className="vb-hero-lede">
            Choose a public ERC-20, shield it into an encrypted balance, and reveal
            it only when you decide. Unshield back to public, 1:1.
          </p>
          <div className="vb-hero-actions">
            <Link className="vb-hero-cta" href="/app">
              Enter dApp
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
            <a className="vb-hero-ghost" href="#flow">
              How it works
            </a>
          </div>
        </div>

        <div className="vb-hero-scene" aria-hidden="true">
          <div className="vb-scene-card">
            <div className="vb-scene-pubhead">
              <span className="vb-scene-mono">PUBLIC — VISIBLE TO EVERYONE</span>
              <span className="vb-scene-mono">SEPOLIA</span>
            </div>
            <div className="vb-scene-pubrow">
              <span className="vb-scene-badge">US</span>
              <span className="vb-scene-token">
                <strong>USDCMock</strong>
                <small>USDC Mock · ERC-20</small>
              </span>
              <span className="vb-scene-amt">1,250.00</span>
            </div>

            <div className="vb-scene-path">
              <span className="vb-scene-rule-top" />
              <span className="vb-scene-chip">
                <Shield size={14} aria-hidden="true" />
                SHIELDED 1:1
              </span>
              <span className="vb-scene-rule-bot" />
            </div>

            <div className="vb-scene-ledger">
              <span className="vb-scene-scan" data-anim-loop="true" />
              <div className="vb-scene-ledgerhead">
                <span className="vb-scene-mono">
                  <Lock size={12} aria-hidden="true" />
                  PRIVATE LEDGER — ENCRYPTED
                </span>
                <span className="vb-scene-mono">HOLDER ONLY</span>
              </div>

              <div className="vb-scene-revealed">
                <span className="vb-scene-row-name">cUSDCMock</span>
                <span className="vb-scene-row-val">1,250.000000</span>
                <span className="vb-scene-tag vb-scene-tag--revealed">REVEALED</span>
              </div>

              {maskedRows.map((row) => (
                <div className="vb-scene-masked" key={row.name}>
                  <span className="vb-scene-row-name">{row.name}</span>
                  <span className="vb-scene-blocks">
                    {row.widths.map((w, i) => (
                      <i key={i} style={{ width: `${w}px` }} />
                    ))}
                  </span>
                  <span className="vb-scene-tag vb-scene-tag--hidden">HIDDEN</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="flow" className="vb-flowband" aria-label="How Veylbase works">
        <div className="vb-flowgrid">
          {flowSteps.map((step) => (
            <div className="vb-flowcell" key={step.idx}>
              <span className="vb-flowcell-idx">{step.idx}</span>
              <strong>{step.title}</strong>
              <span>{step.desc}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="vb-value" aria-label="Why Veylbase">
        <div className="vb-value-copy">
          <div className="vb-eyebrow-row">
            <span className="vb-eyebrow-square" aria-hidden="true" />
            <span className="vb-eyebrow-text">Selective disclosure</span>
          </div>
          <h2>Reveal is a choice, not a default.</h2>
          <p>
            On a public chain, every balance is on display. Veylbase keeps yours
            encrypted until you — and only you — decide to look.
          </p>
        </div>
        <div className="vb-value-rows">
          {valueRows.map((row) => (
            <div className="vb-value-row" key={row.label}>
              <span className="vb-value-row-label">{row.label}</span>
              <span className="vb-value-leader" aria-hidden="true" />
              <span className="vb-value-row-val">{row.value}</span>
            </div>
          ))}
        </div>
      </section>

      <footer className="vb-footer">
        <span className="vb-footer-brand">
          <BrandMark size={24} className="vb-brand-mark" />
          <span className="vb-footer-caption">
            VEYLBASE · BUILT FOR THE ZAMA DEVELOPER PROGRAM · RUNS ON SEPOLIA
          </span>
        </span>
        <nav className="vb-footer-links" aria-label="Resources">
          {footerLinks.map((link) => (
            <a
              className="vb-footer-reslink"
              href={link.href}
              key={link.label}
              rel="noreferrer noopener"
              target="_blank"
            >
              {link.label}
              <ExternalLink size={13} aria-hidden="true" />
            </a>
          ))}
          <Link className="vb-footer-link" href="/app">
            Enter dApp
            <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </nav>
      </footer>
    </main>
  );
}
