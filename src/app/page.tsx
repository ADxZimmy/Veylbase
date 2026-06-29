import Link from "next/link";
import { ArrowRight, Clock, Eye, Shield, Wallet } from "lucide-react";

const flowSteps = [
  { label: "Choose an asset", Icon: Clock },
  { label: "Shield balance", Icon: Shield },
  { label: "Reveal on demand", Icon: Eye },
  { label: "Return to public", Icon: Wallet }
];

export default function Home() {
  return (
    <main className="vb-landing">
      <header className="vb-landing-nav" aria-label="Veylbase">
        <Link className="vb-brand" href="/">
          <span className="vb-brand-mark">V</span>
          <span className="vb-brand-name">
            <strong>Veylbase</strong>
            <small>The confidential wrapper registry for Zama</small>
          </span>
        </Link>
        <Link className="vb-connect" href="/app">
          Enter dApp
          <ArrowRight size={17} aria-hidden="true" />
        </Link>
      </header>

      <section className="vb-hero">
        <div className="vb-hero-copy">
          <span className="vb-eyebrow">Confidential assets, made usable</span>
          <h1>Private balances for public tokens.</h1>
          <p>
            Veylbase gives Zama wrapper pairs a calm, wallet-first interface: choose an
            asset, shield it, and reveal only when you decide.
          </p>
          <div className="vb-hero-actions">
            <Link className="vb-primary vb-hero-cta" href="/app">
              Enter dApp
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
          </div>
        </div>

        <div className="vb-hero-scene" aria-hidden="true">
          <div className="vb-scene-token">
            <small>Public</small>
            <strong>USDC</strong>
            <span>Visible</span>
          </div>
          <div className="vb-scene-bridge">
            <Shield size={20} aria-hidden="true" />
          </div>
          <div className="vb-scene-token vb-scene-token-private">
            <small>Private</small>
            <strong>cUSDC</strong>
            <span className="vb-accent">••••••</span>
          </div>
        </div>
      </section>

      <div className="vb-flow-band">
        {flowSteps.map(({ Icon, label }) => (
          <div className="vb-flow-cell" key={label}>
            <Icon size={18} aria-hidden="true" />
            {label}
          </div>
        ))}
      </div>
    </main>
  );
}
