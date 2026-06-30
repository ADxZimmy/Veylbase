# Context

## Goal

Complete the user-facing confidential action loop for demo readiness: faucet mint, shield, unshield/finalize, reveal, pending states, errors, and activity.

## Relevant Files

- Path: `src/app/veylbase-app-shell.tsx`
  Why it matters: Main dApp interaction surface and wallet/action state owner.

- Path: `src/app/confidential-actions.ts`
  Why it matters: Browser-only execution bridge for viem wallet writes and Zama SDK actions.

- Path: `src/app/chain-reads.ts`
  Why it matters: Public balance reads and post-transaction refresh.

- Path: `src/app/globals.css`
  Why it matters: Compact execution and activity states without returning to dashboard/card-soup UI.

## Decisions

- Decision: Use the installed Zama core SDK directly for Phase 004 instead of introducing a new provider tree.
  Reason: Phase 003 already chose a viem-only wallet layer; the core SDK exposes `shield`, `unshield`, and `balanceOf` primitives without adding new dependencies.

- Decision: Treat transaction success as real only after the SDK/viem promise resolves with a transaction receipt, and treat reveal success as real only after a decrypted bigint is returned.
  Reason: Avoid fabricated success states in a judge-facing confidential dApp.

- Decision: Keep private balances hidden until explicit reveal and clear revealed private values after writes, disconnect, chain changes, and account changes.
  Reason: Prevent stale or cross-account private value leakage.

## Risks

- Risk: Full shield/unshield/reveal requires a real injected wallet, Sepolia ETH, and browser access to Zama relayer/CDN resources.
  Mitigation: Automated checks verify compile/build paths; UAT records wallet-required scenarios separately.

- Risk: Unshield balance validation is skipped in the SDK call.
  Mitigation: If the user has revealed a private balance this session, the UI validates against it; otherwise the chain/SDK remains authoritative and failed transactions surface as errors.
