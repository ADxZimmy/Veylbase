# State

Last updated: 2026-06-30

## Current Focus

Phase 004 is implemented and verified as far as automated/local browser checks can go. The next practical focus is Phase 005: bounty docs, demo script, deployment notes, and final connected-wallet UAT.

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
  - mobile containment fixes for the app shell

## In Progress

- None.

## Blocked

- Real connected-wallet UAT is not run in automation.
  Reason: Requires an injected wallet, funded Sepolia account, user approvals/signatures, and live Zama relayer/CDN access in the browser.

## Next Action

Start Phase 005: update README/demo/deployment docs, then run a real connected-wallet UAT pass for faucet -> shield -> reveal -> unshield/finalize.

## Verification Snapshot

- Command/check: `npm.cmd run typecheck`
  Result: Passed.

- Command/check: `npm.cmd run lint`
  Result: Passed with `--max-warnings=0`.

- Command/check: `npm.cmd run test`
  Result: Passed. 3 files, 9 tests.

- Command/check: `npm.cmd run build`
  Result: Passed. Next production build includes `/`, `/app`, and API routes.

- Command/check: Production smoke `GET /` and `GET /app`
  Result: Passed with status 200 for both.

- Command/check: Mobile browser metric smoke
  Result: Passed. Chrome DevTools reported `innerWidth=484`, `docScroll=484`, `bodyScroll=468`, and app action text present.

- Command/check: Real wallet transaction UAT
  Result: Not run. Requires user-approved wallet actions on Sepolia.
