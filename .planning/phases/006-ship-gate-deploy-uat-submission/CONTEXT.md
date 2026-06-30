# Context

## Goal

Ship Veylbase: deploy to a public Sepolia-connected URL, prove every confidential flow works end-to-end against a funded wallet + live relayer (the make-or-break gate), record the demo, and submit to the Zama Developer Program before 2026-07-07 23:59 AOE.

## Relevant Files

- Path: `.planning/research/PHASE-005-006-RESEARCH-BRIEF.md`
  Why it matters: §4 Vercel deploy checklist, §5 bounty requirements, §8 the full UAT runbook. Source of truth.
- Path: `.planning/phases/006-ship-gate-deploy-uat-submission/UAT.md`
  Why it matters: The funded-wallet runbook the user executes. Self-contained; follow top to bottom.
- Path: `src/lib/chains.ts`
  Why it matters: During UAT, confirm the actual relayer host in the Network tab and reconcile the `relayerUrl`/`gatewayChainId` drift (Brief §3 contradiction).
- Path: `src/app/app/page.tsx`, `src/app/api/*`
  Why it matters: `force-dynamic` SSR + `runtime = "nodejs"` API routes become Vercel serverless functions; keep nodejs (not edge); consider `maxDuration` guards.

## Decisions

- Decision: Deploy on Vercel with the default Next.js preset and essentially no custom config; NO `vercel.json` required; NO COOP/COEP headers.
  Reason: Brief §3/§4 — Next auto-detects, the SDK is single-thread, and cross-origin isolation would break the CDN/relayer fetch and wallet popups.
- Decision: Sepolia testnet is the deployment network (no mainnet).
  Reason: Bounty Builder Track explicitly accepts Sepolia; the SDK has a first-class Sepolia preset (Brief §5).
- Decision: The funded-wallet UAT is the ship gate. No submission until it PASSES, with the WETH 18→6-decimal case as a mandatory sign-off.
  Reason: Correctness is the heaviest judging dimension and the five live paths are unproven (Brief §5, §6, §8).
- Decision: The demo video uses the user's OWN REAL VOICE with subtitles.
  Reason: Binding Zama guidance — "AI-generated video or voice will not be considered" (Brief §5).

## Risks

- Risk: The encrypted path (Reveal/Shield) fails on the deployed origin with a SharedArrayBuffer/relayer/CDN error.
  Mitigation: Expected NOT to happen on the single-thread path. If it does, do NOT add `require-corp` (breaks the CDN fetch) — investigate threaded mode, the CDN URL (`cdn.zama.org/.../0.4.4/...` 200 check), and CSP. Pre-warm `/app` to cache keys in IndexedDB before the demo. (Brief §3 risks.)
- Risk: Public RPC rate-limits during the UAT burst → looks like an SDK bug.
  Mitigation: Set `NEXT_PUBLIC_SEPOLIA_RPC_URL` to a dedicated endpoint and redeploy before the run (Brief §3/§4).
- Risk: Reload-mid-unshield strands funds if the resume fix (Phase 005 SHOULD #9) was cut.
  Mitigation: If resume-unshield was not implemented, document E06 as a known limitation and avoid the reload scenario in the demo; otherwise verify recovery.
- Risk: Live-relayer beats (shield, unshield) stall on camera.
  Mitigation: Pre-fund and pre-mint the wallet before recording; beat 4 (network switch) is conditional/cuttable (Brief §7 recorder notes).
- Risk: Submission portal details (exact deliverable list, reward split) are gated behind the Developer Hub/Guild login.
  Mitigation: Register on the Hub/Guild early to surface the confirmation-email form; target submission 24h before the deadline (Brief §5 caveats).
