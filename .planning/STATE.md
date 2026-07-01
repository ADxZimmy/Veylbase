# State

Last updated: 2026-06-30

## Current Focus

Phase 005 is implemented and verified. The project is ready for Phase 006: Vercel deploy, funded-wallet UAT, final screenshots/demo recording, and Zama Developer Program submission.

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

- None.

## Blocked

- Funded-wallet UAT is owned by the user/Codex during Phase 006.
  Reason: Requires a funded Sepolia wallet, browser wallet approvals/signatures, live Zama relayer/CDN access, and transaction hashes.

## Next Action

Begin Phase 006: deploy on Vercel with a referrer/domain-restricted `NEXT_PUBLIC_SEPOLIA_RPC_URL`, run the funded-wallet UAT from `.planning/phases/006-ship-gate-deploy-uat-submission/UAT.md`, capture screenshots/demo video, then submit.

## Verification Snapshot

- Command/check: `npm.cmd run typecheck`
  Result: Passed.

- Command/check: `npm.cmd run lint`
  Result: Passed with `--max-warnings=0`.

- Command/check: `npm.cmd run test`
  Result: Passed. 4 files, 12 tests.

- Command/check: `npm.cmd run build`
  Result: Passed. Next production build includes `/`, `/app`, and API routes.

- Command/check: production smoke on `npm.cmd run start -- -p 3029`
  Result: Passed. `/` 200, `/app` 200, `Referrer-Policy` and `X-Content-Type-Options` present, COOP/COEP absent.

- Command/check: `npm.cmd audit --omit=dev --json`
  Result: Completed with 5 known production advisories and no scoped non-breaking fix applied.

- Command/check: Funded-wallet transaction UAT
  Result: Not run. This is the Phase 006 ship gate.
