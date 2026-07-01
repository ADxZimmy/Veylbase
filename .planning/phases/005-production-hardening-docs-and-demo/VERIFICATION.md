# Verification

Status: COMPLETE for Phase 005. Wallet-funded/live-relayer proof remains the Phase 006 ship gate.

## Automated Checks

- Command: `npm.cmd run typecheck`
  Result: Passed.
  Notes: TypeScript accepts the `@zama-fhe/sdk` 3.2.0 resume/pending-unshield APIs.

- Command: `npm.cmd run lint`
  Result: Passed.
  Notes: `eslint . --max-warnings=0`.

- Command: `npm.cmd run test`
  Result: Passed.
  Notes: 4 files, 12 tests. Added SDK-free execution-error mapping coverage.

- Command: `npm.cmd run build`
  Result: Passed.
  Notes: Next 16.2.9/Turbopack production build includes `/`, `/app`, and all API routes.

- Command: production smoke with `npm.cmd run start -- -p 3029`
  Result: Passed.
  Notes: `/` returned 200; `/app` returned 200; `Referrer-Policy: strict-origin-when-cross-origin` and `X-Content-Type-Options: nosniff` present; `Cross-Origin-Opener-Policy` and `Cross-Origin-Embedder-Policy` absent.

- Command: inspect package metadata.
  Result: Passed.
  Notes: `@zama-fhe/sdk` is `^3.2.0`; installed package is `3.2.0`; `@zama-fhe/react-sdk` removed because source had zero imports; root `license` is MIT; Node engine is `24.x`.

- Command: `npm.cmd audit --omit=dev --json`
  Result: Completed with known advisories.
  Notes: 5 production advisories reported: `next` via bundled `postcss`, `viem` via `ws`, and `@zama-fhe/sdk` via `viem`. No non-breaking fix was available for the viem/ws chain; npm suggested a nonsensical major/downgrade path for Next, so no broad dependency churn was taken in Phase 005.

## Manual / Static Checks

- Check: `.env.example`, `LICENSE`, dApp-first `README.md`, `docs/ADD_PAIR.md`, and `docs/DEMO.md`.
  Result: Passed.
  Notes: README leads with the user journey, includes Sepolia/Zama runtime notes, Known limitations, MIT license, add-a-pair guide, and demo guide.

- Check: SDK preset values.
  Result: Passed.
  Notes: Installed `@zama-fhe/sdk/chains` Sepolia preset resolves gateway `10901` and relayer `https://relayer.testnet.zama.org/v2`; `src/lib/chains.ts` is annotated as display-only drift pending Phase 006 live Network-tab confirmation.

- Check: resume-interrupted-unshield structure.
  Result: Passed structurally.
  Notes: `executeUnshield` stores the unwrap hash with `savePendingUnshield(indexedDBStorage, wrapperAddress, txHash)`, clears it after finalize, exposes `executeResumeUnshield`, and the shell loads the pending hash on connect/pair selection.

- Check: auto-rehide structure.
  Result: Passed structurally.
  Notes: revealed private balances are cleared after ~8s with an effect keyed on account, chain, selected pair, and private balance; full reveal proof remains Phase 006.

- Check: wallet-free screenshots.
  Result: Not captured.
  Notes: Existing visual state was not re-screenshot in this pass; Phase 006 should capture the final deployed landing/app/mobile plus connected/revealed states.

## Residual Risk

- Risk: Faucet, shield, reveal, unshield, resume-after-reload, and relayer/CDN failure copy are not proven until a funded wallet runs against the live Zama relayer.
  Owner: User/Codex during Phase 006 UAT.

- Risk: `chains.ts` display constants still differ from the SDK preset.
  Owner: Phase 006 UAT. Confirm actual live relayer traffic before changing displayed constants or CSP.

- Risk: NPM audit advisories remain in transitive/runtime dependencies.
  Owner: Track upstream Next/viem/Zama SDK releases; do not force unrelated downgrades before submission.
