# Plan

## Outcome

Veylbase action CTAs execute real wallet/SDK flows instead of stopping at transaction plans, while the UI shows truthful pending, success, error, activity, and revealed-balance states.

## Scope

Included:

- Execute public mock faucet mints with the connected wallet.
- Execute shield via the Zama `WrappedToken.shield` SDK path.
- Execute unshield/finalize via the Zama `WrappedToken.unshield` SDK path.
- Reveal confidential balance via the Zama `Token.balanceOf` user-decryption path.
- Refresh public balance and clear stale revealed private balance after writes.
- Add compact status and activity timeline states with transaction links.
- Update GSD roadmap/state and verification records.

Excluded:

- Mainnet support.
- WalletConnect/wagmi migration.
- Custodial keys or server-side transaction submission.
- Backend relayer proxy/auth hardening beyond current public testnet behavior.

## Steps

1. Add a browser-only confidential action executor around viem and Zama SDK.
2. Wire the app shell primary CTAs to plan, execute, update balances, and surface errors.
3. Add compact execution status and activity details without exposing implementation internals as the primary UI.
4. Verify typecheck, lint, tests, build, and local app render.
5. Update roadmap, state, verification, and UAT notes.

## Verification

- Check: `npm.cmd run typecheck`
  Expected: Pass.

- Check: `npm.cmd run lint`
  Expected: Pass with zero warnings.

- Check: `npm.cmd run test`
  Expected: Existing registry/planner tests pass.

- Check: `npm.cmd run build`
  Expected: Next production build succeeds and includes `/app`.

- Check: Local browser smoke for `/` and `/app`
  Expected: Pages render, app route includes action tabs and no horizontal overflow at mobile width.

## Rollback

Revert `src/app/confidential-actions.ts`, the `veylbase-app-shell.tsx` execution wiring, and the status/activity CSS additions. The previous plan-only app remains usable because `/api/transactions/plan` was not removed.
