# Context

## Goal

Get Veylbase production-ready and submission-ready up to the point that only a funded wallet or a live deploy is missing: harden the confidential flows, add deploy/runtime config, write the full-dApp documentation, and prepare the demo. Everything in this phase can be done and verified WITHOUT a funded wallet or a public deployment (those are Phase 006).

## Relevant Files

- Path: `.planning/research/PHASE-005-006-RESEARCH-BRIEF.md`
  Why it matters: Source of truth for this phase. Contains the concrete env/header/CSP snippets, the auto-rehide effect, the resume-unshield API, the README outline, and the demo script. Cite it; do not re-derive.
- Path: `src/app/confidential-actions.ts`
  Why it matters: Browser-only execution bridge over `@zama-fhe/sdk`. Target for resume-unshield, typed error mapping, and the SDK version bump.
- Path: `src/app/veylbase-app-shell.tsx`
  Why it matters: `runAction` (~488-630) drives execution; reveal success branch (~536-542) and `privateBalances` state (~167) are where auto-rehide and the running-state timeout attach.
- Path: `src/app/execution-errors.ts`
  Why it matters: SDK-import-free error normalizer (string matching only). Stays SDK-free; typed mapping happens upstream in the dynamically-imported bridge.
- Path: `src/lib/chains.ts`
  Why it matters: `relayerUrl`/`gatewayChainId` config drift vs the SDK preset (`relayer.testnet.zama.org/v2`, gateway `10901`). Annotate or correct; do not wire the stale constant.
- Path: `next.config.ts`
  Why it matters: Add security headers (Referrer-Policy, X-Content-Type-Options) — explicitly NOT COOP/COEP. Optional strict CSP.
- Path: `package.json`
  Why it matters: Pin `engines.node` to `24.x`; bump `@zama-fhe/sdk` + `@zama-fhe/react-sdk` `^3.1.0` → `^3.2.0`.
- Path: `README.md`, `config/registry.local.example.json`
  Why it matters: README is backend-foundation-focused; rewrite dApp-first. The example file grounds the add-a-pair guide.

## Decisions

- Decision: Do NOT add COOP/COEP cross-origin-isolation headers.
  Reason: The SDK calls `web()` argument-less (single-threaded), so `SharedArrayBuffer` is not needed. `COEP: require-corp` would block the cross-origin `cdn.zama.org` WASM/key fetch and `COOP: same-origin` can sever the `window.opener` link MetaMask popups use. (Brief §3, TL;DR.)
- Decision: Treat the `@zama-fhe/sdk` Sepolia preset as the authoritative runtime source for relayer host / gateway chain id; `chains.ts` `relayerUrl`/`gatewayChainId` are display-only and unused by `createSdk`.
  Reason: Decompiled SDK resolves `relayer.testnet.zama.org/v2`; the repo constant `relayer.testnet.zama.cloud` is never passed to the SDK (Brief §3 contradiction). Wiring the stale constant risks a dead host.
- Decision: Tier the work (Must / Should / Nice) against the 2026-07-07 AOE deadline so scope can be cut without losing the ship-critical items.
  Reason: ~7 days; correctness + production-readiness are the heaviest judging dimensions.

## Risks

- Risk: SDK `3.1 → 3.2` minor bump introduces a behavioral change in `shield`/`unshield`/`balanceOf`.
  Mitigation: Read the changelog before bumping; re-run the full quality gate; the live UAT (Phase 006) is the real proof. Keep the bump revertible (single `package.json` + lockfile change).
- Risk: Resume-unshield premise correction (B1). The SDK does NOT auto-persist the unwrap — `unshield()` never calls `savePendingUnshield`, and that symbol has no internal call sites in the installed dist, so `loadPendingUnshield` would always return null and a banner relying on SDK persistence is a silent no-op.
  Mitigation: The APP persists the hash: call `savePendingUnshield(indexedDBStorage, wrapperAddress, txHash)` in `onUnwrapSubmitted` and `clearPendingUnshield` on finalize; resume via `wrapper.resumeUnshield(hash)`. Verify the banner shows for an entry written via `savePendingUnshield` (the real key path), not a hand-rolled key. Full on-chain proof is Phase 006 UAT case E06. Build this against the SHIPPING SDK version (bump first — see PLAN step 8 before 9).
- Risk: Auto-rehide effect could fight an in-flight reveal or leak a timer across pair/account/network changes.
  Mitigation: Use the exact effect from Brief §6 fix #1 (keyed on `privateBalance` + `selectedPair.id` + `account` + `chainId`, cleanup clears the timer); already-existing clears on disconnect/accountsChanged/chainChanged remain.
- Risk: Strict CSP white-screens the app if a required directive is missing.
  Mitigation: CSP is Nice-tier and optional; if added, use the exact directive set in Brief §3 snippet B (`worker-src blob:`, `'wasm-unsafe-eval'`, `connect-src` cdn.zama.org + relayer + RPC) and verify every flow in the deployed console before relying on it.
