# Context

## Goal

Build the first usable Veylbase UI shell: a premium DeFi-style confidential asset portal that sits on top of the verified backend APIs.

## Relevant Files

- Path: `design-system/veylbase/MASTER.md`
  Why it matters: Required UI UX Pro Max baseline for type, layout, accessibility, and anti-patterns, with Veylbase/Zama overrides.

- Path: `design-system/veylbase/pages/home.md`
  Why it matters: Page-specific app-shell rules for the first usable dApp screen.

- Path: `C:\Users\PC\Downloads\Veylbase.md`
  Why it matters: Authoritative project naming and brand-context brief for Veylbase.

- Path: `src/app/page.tsx`
  Why it matters: Current placeholder page to replace with the actual dApp experience.

- Path: `src/app/globals.css`
  Why it matters: Global theme and font tokens should be aligned with the design system and Zama-inspired direction.

- Path: `src/app/api/registry/route.ts`
  Why it matters: UI source for registry pairs, source health, coverage, and warnings.

- Path: `src/app/api/faucet/route.ts`
  Why it matters: UI source for faucet-ready public mock pairs.

- Path: `src/app/api/transactions/plan/route.ts`
  Why it matters: UI source for guided wrap, unwrap, decrypt, and faucet step previews.

- Path: `src/lib/registry/types.ts`
  Why it matters: Shared shape for registry cards, tables, badges, and action panels.

- Path: `src/lib/transactions/types.ts`
  Why it matters: Shared shape for transaction timelines and action step UI.

## Decisions

- Decision: First viewport should be the working dApp, not a landing page.
  Reason: The challenge is UX-heavy and judges need to test functionality quickly.

- Decision: Use a DeFi operating-console layout.
  Reason: The shared research pointed to Uniswap for transaction flows, Aave for asset registry browsing, and premium privacy products for confidential balance treatment.

- Decision: Keep visual style dark, crisp, and Zama-accented.
  Reason: Prior direction favored dark mode with Zama yellow and a premium cryptography feel, while the UI UX Pro Max system adds crypto/fintech typography and contrast constraints.

- Decision: Treat Veylbase as "Veil + base" with descriptor "The confidential wrapper registry for Zama."
  Reason: The provided naming brief establishes this as the recommended primary name and avoids the earlier incorrect shorthand direction.

- Decision: Use Zama yellow `#FFD208` as the anchor accent, with black/graphite/light-gray/white neutrals.
  Reason: The provided naming brief cites this as the official Zama palette and recommends yellow for CTAs, active states, decryption affordances, badges, and focus states.

## Risks

- Risk: Building too much visual decoration before wallet execution can slow demo readiness.
  Mitigation: Build dense, usable product surfaces first: registry, action panel, faucet, decrypt cards, and activity.

- Risk: UI may diverge from actual SDK capabilities.
  Mitigation: Drive UI from existing API contract and defer executable wallet submission to Phase 003.

- Risk: Responsive state density can cause overlap on mobile.
  Mitigation: Verify at 375px, 768px, 1024px, and 1440px before marking the phase complete.
