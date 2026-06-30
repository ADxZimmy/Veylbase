# State

Last updated: 2026-06-30

## Current Focus

Phases 001-004 are complete and committed; the Phase 004 review fixes (confidential-decimals correctness, lazy-loaded SDK, mobile-clipping root fix) are in. The Phase 005 and 006 GSD plans are authored (see `.planning/phases/005-*`, `006-*`, grounded in `.planning/research/PHASE-005-006-RESEARCH-BRIEF.md`). The next practical focus is executing Phase 005 (production hardening + docs + demo prep); Phase 006 (deploy + funded-wallet UAT + bounty submission) follows.

## Completed

- Parsed shared ChatGPT/context artifacts and Zama Developer Hub context for the Bounty Track.
- Confirmed product direction: Veylbase, "The confidential wrapper registry for Zama."
- Used UI UX Pro Max and persisted the design system under `design-system/veylbase/MASTER.md`.
- Initialized git on branch `main` and added `.gitignore`.
- Implemented official Sepolia registry snapshot with 8 pairs and 7 public faucet-ready mock pairs.
- Implemented optional live on-chain registry reconciliation with `@zama-fhe/sdk` `WrappersRegistry`.
- Implemented local config extension via `config/registry.local.example.json`.
- Implemented API routes for registry, validation, faucet guidance, and transaction planning.
- Implemented transaction planner for faucet, shield/wrap, unshield/unwrap/finalize, and decrypt balance.
- Replaced the rejected dashboard/card-soup UI with the `Veylbase.dc.html`-aligned product shell:
  - `/` public landing page with `Enter dApp`
  - `/app` single-focus dApp surface
  - asset selection, action tabs, hidden/revealed private balance affordance, developer plan drawer, and activity strip
- Completed Phase 003 wallet work:
  - viem + injected EIP-1193 wallet connection
  - Sepolia guard/switch
  - real public ERC-20 balance reads
  - balance-aware MAX/validation
- Completed Phase 004 confidential flow work:
  - browser-only `src/app/confidential-actions.ts` execution bridge
  - real mock faucet `mint(address,uint256)` wallet write
  - Zama SDK `WrappedToken.shield` execution
  - Zama SDK `WrappedToken.unshield` execution with finalize orchestration
  - Zama SDK `Token.balanceOf` reveal/decryption path
  - pending/submitted/finalizing/success/error status strip
  - transaction-linked activity rows
  - public-balance refresh and stale private-balance clearing after writes/account/network changes
- Completed Phase 004 review fixes:
  - fixed confidential-decimals handling (WETH 18 underlying / 6 confidential): reveal display, unwrap amount, private-balance validation, and the shield precision cap now use `confidentialDecimals`, not underlying decimals
  - dropped `skipBalanceCheck` on unshield so over-unshields fail pre-flight, not on-chain
  - lazy-loaded `@zama-fhe/sdk` off the initial `/app` bundle (dynamic import in `runAction`; SDK-free `execution-errors.ts`)
  - fixed mobile clipping at the root (`min-width: 0` on action-card grid/flex items; removed the brittle `100vw` calc/overflow workarounds)
  - test suite to 10 tests / 3 files; gate green
- Authored the Phase 005 and Phase 006 GSD plans from a six-agent research brief (`.planning/research/PHASE-005-006-RESEARCH-BRIEF.md`): production hardening, deploy config, docs/demo, and the funded-wallet UAT runbook.

## In Progress

- None. Phase 005/006 plans are authored and awaiting execution.

## Blocked

- Funded-wallet UAT is owned by the user (planned as the Phase 006 ship gate).
  Reason: Requires an injected wallet, funded Sepolia account, user approvals/signatures, and live Zama relayer/CDN access in the browser. A full ordered runbook is ready at `.planning/phases/006-ship-gate-deploy-uat-submission/UAT.md`.

## Next Action

Execute Phase 005 MUST items: `.env.example` + dedicated-RPC decision, `engines.node` pin, `next.config.ts` security headers (NO COOP/COEP), `maxDuration` route guards, `LICENSE`, dApp-first README (with a Known-limitations section), `docs/DEMO.md` script, and the `chains.ts` config-drift annotation. Then SHOULD: bump SDK to `^3.2.0` FIRST, then resume-interrupted-unshield (app persists the unwrap hash via `savePendingUnshield`), auto-rehide, typed error UX. Follow the dated critical path + freeze rule in `.planning/phases/006-*/PLAN.md` (Day-1 portal registration runs in parallel; no new code after Day 5 EOD; submit ≥24h early). The plan review with all findings applied is at `.planning/phases/005-*/REVIEW.md`.

## Verification Snapshot

- Command/check: `npm.cmd run typecheck`
  Result: Passed.

- Command/check: `npm.cmd run lint`
  Result: Passed with `--max-warnings=0`.

- Command/check: `npm run test`
  Result: Passed. 3 files, 10 tests (added the confidential-decimals 18/6 mapping case).

- Command/check: `npm run build`
  Result: Passed. Next production build includes `/`, `/app`, and API routes.

- Command/check: Confidential-decimals fix (WETH 18/6) in the browser
  Result: Passed. Live preview shows shield of `1.123456789` WETH → receive `1.123456 cWETH`, refund `0.000000789 WETH`, "capped at 6 decimals".

- Command/check: Mobile clipping at 375px
  Result: Passed. 0 horizontal-overflow offenders after the `min-width: 0` fix; amount field + preview fully visible; desktop unaffected.

- Command/check: Initial `/app` bundle excludes the Zama SDK
  Result: Passed. Initial `/app` JS load fetches no `@zama-fhe/sdk` chunk; the SDK loads on first action via dynamic import.

- Command/check: Funded-wallet transaction UAT (faucet -> shield -> reveal -> unshield, incl. WETH decimals gate)
  Result: Not run. Owned by the user as the Phase 006 ship gate; runbook ready at `.planning/phases/006-*/UAT.md`.
