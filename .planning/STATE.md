# State

Last updated: 2026-07-01

## Current Focus

Phase 006 is in progress. The GitHub repo is connected to Vercel and the production deployment is live at `https://veylbase.vercel.app`; funded-wallet UAT, final screenshots/demo recording, and Zama Developer Program submission remain.

## Completed

- Phases 001-004 remain complete and committed.
- Added Phase 005 runtime/deploy hardening:
  - `.env.example` with `NEXT_PUBLIC_SEPOLIA_RPC_URL`
  - Node `24.x` engine pin
  - MIT `LICENSE` and package SPDX metadata
  - minimal security headers in `next.config.ts`
  - no COOP/COEP
  - `maxDuration = 30` on `/app` and the four API routes
  - `chains.ts` annotation for SDK-preset relayer/gateway drift
- Updated dependencies:
  - bumped `@zama-fhe/sdk` to `^3.2.0`
  - removed unused `@zama-fhe/react-sdk`
- Added confidential-flow resilience:
  - persist unwrap hash with `savePendingUnshield`
  - clear pending hash after successful finalize
  - load pending unshield on connect/pair selection
  - resume pending unshield with `wrapper.resumeUnshield`
  - auto-hide revealed balances after ~8s
  - typed SDK error mapping for wallet rejection, chain mismatch, balance, relayer, decryption, and CDN/runtime failures
  - retry affordance and 90s soft timeout for long-running actions
- Reworked docs:
  - dApp-first README with Known limitations
  - `docs/ADD_PAIR.md`
  - `docs/DEMO.md`
- Added unit coverage for the SDK-free error mapper.

## In Progress

- Phase 006 ship gate:
  - Vercel project `sanuske2-2147s-projects/veylbase` is linked to `https://github.com/ADxZimmy/Veylbase`.
  - Production deployment is ready at `https://veylbase.vercel.app`.
  - Non-wallet smoke checks passed for `/`, `/app`, headers, and the Zama relayer SDK CDN artifact.

## Blocked

- Funded-wallet UAT is owned by the user/Codex during Phase 006.
  Reason: Requires a funded Sepolia wallet, browser wallet approvals/signatures, live Zama relayer/CDN access, and transaction hashes.

## Next Action

Run the funded-wallet UAT from `.planning/phases/006-ship-gate-deploy-uat-submission/UAT.md` on `https://veylbase.vercel.app`. Add a dedicated, referrer-restricted `NEXT_PUBLIC_SEPOLIA_RPC_URL` in Vercel before UAT if the public fallback RPC is slow or rate-limited, then redeploy.

## Verification Snapshot

- Command/check: `npm.cmd run typecheck`
  Result: Passed.

- Command/check: `npm ci`
  Result: Passed after refreshing `package-lock.json` for missing optional `@emnapi/core` and `@emnapi/runtime` entries.

- Command/check: `npm.cmd run lint`
  Result: Passed with `--max-warnings=0`.

- Command/check: `npm.cmd run test`
  Result: Passed. 4 files, 12 tests.

- Command/check: `npm.cmd run build`
  Result: Passed. Next production build includes `/`, `/app`, and API routes.

- Command/check: Vercel production deployment
  Result: Passed. Live URL is `https://veylbase.vercel.app`; project is linked to GitHub repo `ADxZimmy/Veylbase`.

- Command/check: deployed smoke
  Result: Passed for non-wallet checks. `/` 200, `/app` 200, `Referrer-Policy` and `X-Content-Type-Options` present, COOP/COEP absent, `https://cdn.zama.org/relayer-sdk-js/0.4.4/relayer-sdk-js.umd.cjs` returns 200, and Vercel production error logs were clean for the first post-deploy window.

- Command/check: production smoke on `npm.cmd run start -- -p 3029`
  Result: Passed. `/` 200, `/app` 200, `Referrer-Policy` and `X-Content-Type-Options` present, COOP/COEP absent.

- Command/check: `npm.cmd audit --omit=dev --json`
  Result: Completed with 5 known production advisories (2 moderate, 3 high) and no scoped non-breaking fix applied.

- Command/check: Funded-wallet transaction UAT
  Result: Not run. This remains the Phase 006 ship gate.
