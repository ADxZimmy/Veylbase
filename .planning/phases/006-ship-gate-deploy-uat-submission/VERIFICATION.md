# Verification

Status: PLANNED — not yet executed. This phase's primary verification is the funded-wallet UAT runbook (UAT.md), executed by the user.

## Automated Checks

- Command: Post-deploy smoke of the live `/app` (load page, Connect wallet, Network tab header inspection, `cdn.zama.org/.../0.4.4/relayer-sdk-js.umd.cjs` 200 check).
  Result: Pending.
  Notes: Brief §4.7. No funded wallet required for the load/connect/header checks.

## Manual Checks

- Check: UAT.md §2 (USDC T01–T08) — full happy path on-chain.
  Result: Pending.
  Notes: User-executed. Record all tx hashes + revealed values.

- Check: UAT.md §3 (WETH W01–W05) — decimals-fix gate.
  Result: Pending.
  Notes: Mandatory. Any power-of-ten error = FAIL = fix before submit.

- Check: UAT.md §4 (E01–E06) — error/edge behavior.
  Result: Pending.
  Notes: E06 (reload-mid-unshield) proves the resume-unshield fix; if cut, log as known limitation.

- Check: Submission artifacts present (public repo, live URL, demo video, LICENSE, README live-demo section) and filed before deadline.
  Result: Pending.

## Residual Risk

- Risk: The encrypted path could fail only on the deployed origin (CDN/relayer/CSP/threaded-mode), invisible to the static gate and local dev.
  Owner: User/Codex during the post-deploy smoke + UAT. Mitigation in CONTEXT.md risks (do not add `require-corp`).

- Risk: Submission portal exact deliverables / reward split are gated behind Developer Hub/Guild login (Brief §5 caveats).
  Owner: User — register early, confirm the precise list, submit 24h before the deadline.

- Risk: Live-relayer demo beats stall on camera.
  Owner: User — pre-fund/pre-mint; beat 4 is conditional.
