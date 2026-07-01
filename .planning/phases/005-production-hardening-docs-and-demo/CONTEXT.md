# Context

## Goal

Get Veylbase production-ready and submission-ready up to the point that only a funded wallet or a live deploy is missing: harden the confidential flows, add deploy/runtime config, write full-dApp documentation, and prepare the demo. Everything in this phase can be done and verified without a funded wallet or a public deployment; those remain Phase 006.

## Relevant Files

- Path: `.planning/research/PHASE-005-006-RESEARCH-BRIEF.md`
  Why it matters: Source of truth for this phase. Contains env/header/CSP notes, auto-rehide, resume-unshield API, README outline, and demo script.
- Path: `src/app/confidential-actions.ts`
  Why it matters: Browser-only execution bridge over `@zama-fhe/sdk`. Target for resume-unshield, typed error mapping, and SDK version bump.
- Path: `src/app/veylbase-app-shell.tsx`
  Why it matters: Owns `runAction`, pending-unshield recovery UI, private balance reveal state, running timeout, and retry.
- Path: `src/app/execution-errors.ts`
  Why it matters: SDK-import-free error normalizer. Typed mapping happens upstream in the dynamically imported bridge.
- Path: `src/lib/chains.ts`
  Why it matters: `relayerUrl` and `gatewayChainId` display metadata drift from the SDK preset. Annotate, do not wire stale constants.
- Path: `next.config.ts`
  Why it matters: Adds security headers while explicitly avoiding COOP/COEP.
- Path: `package.json`
  Why it matters: Pins Node `24.x`, declares MIT, uses `@zama-fhe/sdk` `^3.2.0`, and removes unused `@zama-fhe/react-sdk`.
- Path: `README.md`, `docs/ADD_PAIR.md`, `docs/DEMO.md`
  Why it matters: README is dApp-first; docs hold the add-a-pair and demo recording guides.

## Decisions

- Decision: Do not add COOP/COEP cross-origin-isolation headers.
  Reason: The SDK calls `web()` argument-less (single-threaded), so `SharedArrayBuffer` is not needed. COEP can block `cdn.zama.org` runtime fetches and COOP can interfere with wallet popups.
- Decision: Treat the `@zama-fhe/sdk` Sepolia preset as the authoritative runtime source for relayer host and gateway chain id.
  Reason: Installed SDK 3.2.0 resolves relayer `https://relayer.testnet.zama.org/v2` and gateway `10901`; existing `chains.ts` values are display-only.
- Decision: Phase 005 chose MIT, `NEXT_PUBLIC_SEPOLIA_RPC_URL` with a referrer/domain-restricted public key, and `@zama-fhe/sdk` `^3.2.0`; the unused React SDK package was removed.
  Reason: These choices satisfy submission, license, and deployment requirements with the least moving parts before Phase 006 live wallet proof.

## Risks

- Risk: SDK 3.2.0 introduces behavior not caught by static checks.
  Mitigation: Full funded-wallet UAT remains the Phase 006 ship gate.
- Risk: Resume-unshield recovery is only structurally verified in Phase 005.
  Mitigation: App persists with `savePendingUnshield`, clears with `clearPendingUnshield`, and resumes with `wrapper.resumeUnshield`; Phase 006 UAT case E06 proves it live.
- Risk: Auto-rehide could behave differently under live reveal timing.
  Mitigation: Effect is keyed on private balance, selected pair, account, and chain; Phase 006 reveal cases prove it with a real wallet.
- Risk: Strict CSP can white-screen the app if a runtime endpoint is missing.
  Mitigation: CSP remains out of Phase 005; consider it only after Phase 006 confirms actual relayer/RPC hosts.
