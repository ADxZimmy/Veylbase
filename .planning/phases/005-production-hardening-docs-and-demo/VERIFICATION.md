# Verification

Status: PLANNED — not yet executed. The checks below are the gate for this phase; record actual results here when the phase runs.

## Automated Checks

- Command: `npm run typecheck`
  Result: Pending.
  Notes: Must pass after the SDK bump and all code fixes.

- Command: `npm run lint`
  Result: Pending.
  Notes: `--max-warnings=0`. Watch for unused imports from the resume-unshield/error-mapping additions.

- Command: `npm run test`
  Result: Pending.
  Notes: Existing ≥10 pass; add coverage for auto-rehide clearing state and (if feasible) resume-banner gating.

- Command: `npm run build`
  Result: Pending.
  Notes: Confirm the document response carries NO `Cross-Origin-Opener-Policy` / `Cross-Origin-Embedder-Policy` headers (Brief §3 decision).

- Command: `npm run build && npm run start`, smoke `/` and `/app`
  Result: Pending.
  Notes: Production bundle (not `next dev`). Idle console clean; security headers present; resume banner shows only for a synthetic pending unshield entry.

- Command: inspect `package-lock.json` for `@zama-fhe/sdk`
  Result: Pending.
  Notes: Expect 3.2.x for both `@zama-fhe/sdk` and `@zama-fhe/react-sdk`.

## Manual Checks

- Check: README contains every Brief §7 section; `.env.example` + `LICENSE` exist; `docs/DEMO.md` has the timed beat table.
  Result: Pending.

- Check: Auto-rehide — reveal a (mock/local) balance, confirm it re-hides to `******` after ~8s and the timer clears on pair/account/network change.
  Result: Pending.
  Notes: Without a funded wallet, exercise via a local-config pair or a unit test of the effect; full path proven in Phase 006 UAT T06/T08.

- Check: Wallet-free screenshots captured (landing, shield idle disconnected, asset sheet, reveal hidden, plan drawer, mobile).
  Result: Pending.

## Residual Risk

- Risk: Auto-rehide only fully proves against a real revealed balance.
  Owner: User/Codex during Phase 006 UAT cases T06/T08.

- Risk: Typed error mapping + relayer/CDN copy only proves against a live failure.
  Owner: User/Codex during Phase 006 UAT case E05.

- Risk: Resume-interrupted-unshield (app-side `savePendingUnshield` persistence + `resumeUnshield`) only proves on a real reload-mid-unshield.
  Owner: User/Codex during Phase 006 UAT case E06.

- Risk: SDK 3.2 behavioral change not caught by the static gate.
  Owner: User/Codex — surfaces in the Phase 006 live UAT; keep the bump revertible (PLAN M5 decision rule).

- Risk: Connected/revealed-state screenshots (reveal shown, faucet/shield/unshield activity) need a funded wallet.
  Owner: Captured during the Phase 006 UAT run.
