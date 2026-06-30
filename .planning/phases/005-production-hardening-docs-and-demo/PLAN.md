# Plan

## Outcome

Veylbase is production-hardened and documented: the confidential flows survive interruption and surface readable errors, runtime/deploy config exists, the README sells and explains the full dApp, and the demo is fully scripted. After this phase the only things left are deploy, the funded-wallet UAT, the demo recording, and the bounty submission (all Phase 006).

## Scope

Included: production/runtime config (`.env.example` + dedicated-RPC decision, `engines.node` pin, `next.config.ts` security headers WITHOUT COOP/COEP, `maxDuration` guards, optional CSP, `LICENSE`); SDK currency (`^3.2.0` bump, re-gate); resilience/UX fixes (resume-interrupted-unshield, auto-rehide, typed error UX, running-state timeout, `chains.ts` config-drift annotation); docs (dApp-first README incl. a Known-limitations section, add-a-pair guide, wallet-free screenshots, `docs/DEMO.md` demo script).

Excluded (Phase 006): public deployment, the funded-wallet UAT run, the demo recording, the bounty submission, and any screenshot needing a connected/revealed state.

## Steps

Tiered against the 2026-07-07 AOE deadline: MUST first; SHOULD strongly recommended (high judging value); NICE if time allows. Within SHOULD, the SDK bump (step 5) MUST precede the resume-unshield work (step 9) — see M5.

### MUST — production-readiness + correctness/UX gate
1. **`.env.example` + decide the RPC key model.** Add at repo root:
   ```
   # Optional: dedicated Sepolia RPC (Alchemy/Infura/dRPC). Falls back to a public node.
   NEXT_PUBLIC_SEPOLIA_RPC_URL=
   ```
   `NEXT_PUBLIC_` is inlined at build time → shipped to the browser → redeploy to change. **Decision (N6): use a referrer/domain-restricted `NEXT_PUBLIC_` Alchemy/Infura key — no code change.** Only if the provider can't restrict by referrer do the server-only-key + proxy code change to `onchain.ts`/`chain-reads.ts` here under the green gate; otherwise mark the proxy variant out of scope (Phase 007). Record the choice in REQUIREMENTS Open Questions.
2. **Pin Node** in `package.json`: `"engines": { "node": "24.x" }`.
3. **Merge security headers into the existing `next.config.ts`** (keep `typedRoutes: true`; add an async `headers()` block — do NOT replace the file): `Referrer-Policy: strict-origin-when-cross-origin`, `X-Content-Type-Options: nosniff`. Explicit comment: do NOT add COOP/COEP (Brief §3). (CSP is NICE — step 12.)
4. **Add `maxDuration` route guards (M1)** — `export const maxDuration = 30;` in `src/app/app/page.tsx`, `src/app/api/registry/route.ts`, `src/app/api/registry/validate/route.ts`, `src/app/api/faucet/route.ts`, `src/app/api/transactions/plan/route.ts`. The registry service already falls back to the static snapshot on a failed live read, so a 30s cap degrades gracefully.
5. **Add a `LICENSE`** (MIT or BSD-3-Clause-Clear) with the real copyright holder + 2026 (N3); set `package.json` `"license"` to the matching SPDX id; name the same license in the README.
6. **Annotate the `chains.ts` config drift AND rewrite `README.md`** dApp-first per Brief §7 (M6).
   - In `src/lib/chains.ts`, comment the concrete mismatch: repo holds `gatewayChainId: 55815` (`:16`) and `relayerUrl: relayer.testnet.zama.cloud` (`:21`); the `@zama-fhe/sdk` Sepolia preset resolves gateway `10901` / `relayer.testnet.zama.org/v2`. Both repo fields are **unused by `createSdk`** (it spreads the preset, overrides only `.network`, and uses `web()`). Annotation: "display-only; the `@zama-fhe/sdk` Sepolia preset is authoritative; confirm the live host in the Network tab at Phase 006 UAT and correct this value then." Do NOT assert a host as fact or wire the stale constant.
   - README per Brief §7, including a **"Known limitations"** subsection (N7) seeded with the mid-flow network-switch orphaned-tx note and the `confidentialDecimals ?? 6` fallback note. In the Sepolia/Zama notes section, **LEAD with the SDK preset values** (gateway `10901`, relayer `relayer.testnet.zama.org/v2`) and footnote the stale `chains.ts` constants.
7. **Write the demo script to `docs/DEMO.md`** (single committed location; UAT.md only points to it — N9) — the ~3-min timed beat table from Brief §7 plus recorder notes (own real voice + subtitles; pre-fund/pre-mint; beat 4 conditional).

### SHOULD — resilience + UX (drives Correctness/UX/Production-readiness)
8. **Bump the SDK FIRST (M5).** `@zama-fhe/sdk` `^3.1.0 → ^3.2.0`; for `@zama-fhe/react-sdk` (N1: currently zero imports in `src/`) either remove it from `dependencies` (leaner — preferred) or annotate it as intentionally retained. Reinstall; read the 3.2.0 changelog specifically for `resumeUnshield`/`savePendingUnshield`/`loadPendingUnshield`/`clearPendingUnshield` persistence and `Shield/UnshieldCallbacks` signatures. Re-run the full gate. **Decision rule:** if 3.2.0 changes the unshield-persistence API or can't be validated in time, REVERT to 3.1.0 and ship it (3.1.0 is current/non-deprecated). Re-derive the pinned `cdn.zama.org/relayer-sdk-js/<version>/...` URL + SHA-384 integrity from the shipping dist for the Phase 006 smoke; do not assume `0.4.4` carries over.
9. **Resume interrupted unshield (B1 — corrected; highest value), built against the shipping SDK.** The SDK does NOT auto-persist the unwrap (`unshield()` never calls `savePendingUnshield`; that symbol has no internal call sites). The APP must persist it: in `src/app/confidential-actions.ts` `executeUnshield`, inside `onUnwrapSubmitted` call `savePendingUnshield(indexedDBStorage, wrapperAddress, txHash)` (import from `@zama-fhe/sdk`); after a successful finalize call `clearPendingUnshield(indexedDBStorage, wrapperAddress)`. Add `executeResumeUnshield` wrapping `wrapper.resumeUnshield(hash)` (works from the hash alone — reloads the receipt and finalizes). On connect / pair-select, call `loadPendingUnshield(indexedDBStorage, wrapperAddress)`; if a pending hash exists, render a "Resume pending unshield" banner whose action calls `executeResumeUnshield`. Use the SAME `indexedDBStorage` instance + `wrapperAddress` the SDK uses so keys match.
10. **Auto-rehide revealed balance after ~8s** (Brief §6 fix #1). Add the keyed effect (`privateBalance`, `selectedPair.id`, `account`, `chainId`) that clears the revealed entry; cleanup clears the timer; re-reveal restarts the window. No new state.
11. **Typed error mapping + relayer/CDN copy + retry + running-state timeout.** In `confidential-actions.ts`, wrap each `execute*` in try/catch that does `instanceof` against the exported SDK error classes (`RelayerRequestFailedError`, `DecryptionFailedError`, `InsufficientConfidentialBalanceError`, `ChainMismatchError`, `SigningRejectedError`, `NoCiphertextError`) / the `ZamaErrorCode` enum and re-throws with a stable `.code`; keep `execution-errors.ts` string-matching as the SDK-free fallback (N2). Map the **SDK-init / worker-load failure distinctly** (M4): "Could not load the Zama encryption runtime (cdn.zama.org). Check your connection and retry." Add the relayer-request copy "the Zama relayer may be temporarily unavailable — try again" + a Retry button, and a running-state soft timeout so the primary button can't hang on "Working..." forever.

### NICE — polish if time remains
12. **Strict CSP** (Brief §3 snippet B) — only with per-flow console verification. If shipped, `connect-src` MUST list the ACTUAL dedicated RPC host (not publicnode) and the relayer host **confirmed at UAT**; until then list BOTH `relayer.testnet.zama.org` and `relayer.testnet.zama.cloud` (M2). Prefer shipping WITHOUT strict CSP for the submission rather than risk a white-screen.
13. **`confidentialDecimals` assertion** — replace the `?? 6` fallback at `veylbase-app-shell.tsx:~537` with an assertion/derivation (Brief §6 item 6, the document-only bucket — N11). The mid-flow network-switch limitation is documented in the README Known-limitations section (step 6), so it survives even if this code item is cut.

### CLOSE-OUT
14. Re-run the full quality gate; capture wallet-free screenshots (landing, shield idle disconnected, asset sheet, reveal hidden, plan drawer, mobile); update VERIFICATION.md, UAT.md, ROADMAP.md, STATE.md. (Connected-state screenshots + the hero `demo.gif` are captured during the Phase 006 UAT run — the only funded-wallet pass.)

## Verification

- Check: `npm run typecheck` → Pass.
- Check: `npm run lint` → Pass (`--max-warnings=0`); watch for unused imports from resume-unshield / error-mapping.
- Check: `npm run test` → Pass; add a test that auto-rehide clears state, and (if feasible) that the resume banner gates on a pending entry written via `savePendingUnshield` (not a hand-rolled key).
- Check: `npm run build` → succeeds; document response carries NO COOP/COEP headers.
- Check: `npm run build && npm run start` smoke of `/` + `/app` → render; security headers present; idle console clean; "Resume pending unshield" banner shows only for a real pending entry.
- Check: `package-lock.json` `@zama-fhe/sdk` resolves to 3.2.x (or, if reverted per M5, 3.1.0 deliberately).
- Check: README has every Brief §7 section + Known-limitations; `.env.example`, `LICENSE`, `docs/DEMO.md` exist; `maxDuration` present in the five route files.

## Rollback

Each item is independently revertible: the SDK bump is a `package.json`/lockfile revert; resume-unshield, auto-rehide, and error-UX are additive (revert `confidential-actions.ts`, `veylbase-app-shell.tsx`, `execution-errors.ts` file-by-file); config/docs are new files. The Phase-004 execution paths remain intact if any SHOULD/NICE item is dropped.
