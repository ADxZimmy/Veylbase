import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Home } from "lucide-react";
import { BrandMark } from "./brand-mark";

export const metadata: Metadata = {
  title: "Page not found"
};

export default function NotFound() {
  return (
    <main className="vb-notfound">
      <Link className="vb-brand vb-brand--lg" href="/">
        <BrandMark size={34} className="vb-brand-mark" />
        <span className="vb-brand-name">
          <strong>VEYLBASE</strong>
          <small>CONFIDENTIAL WRAPPER REGISTRY</small>
        </span>
      </Link>

      <div className="vb-notfound-body">
        <div className="vb-eyebrow-row">
          <span className="vb-eyebrow-square" aria-hidden="true" />
          <span className="vb-eyebrow-text">Error 404 · Off the ledger</span>
        </div>
        <h1 className="vb-notfound-code" aria-hidden="true">
          <span className="vb-notfound-blocks">
            <i style={{ width: "34px" }} />
            <i style={{ width: "20px" }} />
            <i style={{ width: "44px" }} />
          </span>
          404
        </h1>
        <h2 className="vb-notfound-title">This page isn&rsquo;t on record.</h2>
        <p className="vb-notfound-lede">
          The address you followed doesn&rsquo;t resolve to anything on Veylbase. It
          may have moved, or never existed. Head back and pick up the trail.
        </p>
        <div className="vb-hero-actions">
          <Link className="vb-hero-cta" href="/app">
            Enter dApp
            <ArrowRight size={18} aria-hidden="true" />
          </Link>
          <Link className="vb-hero-ghost" href="/">
            <Home size={17} aria-hidden="true" />
            Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
