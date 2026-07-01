# Roadmap

## Completed

- Phase: 001 - Backend foundation and project operating plan
  Outcome: Establish typed registry, transaction planning APIs, source docs, tests, verification record, and GSD Hybrid operating state.
  Status: Complete

- Phase: 002 - UI/UX product shell
  Outcome: Build the Veylbase landing + `/app` dApp shell with registry browsing, wallet/network states, and action panels wired to existing APIs.
  Status: Complete

- Phase: 003 - Wallet and Zama SDK integration
  Outcome: Connect wallet, switch Sepolia, read real public balances, and prepare executable user flows.
  Status: Complete

- Phase: 004 - Confidential flow completion
  Outcome: Real faucet, shield, unshield/finalize, decrypt, errors, pending states, and activity timeline; plus review fixes (confidential-decimals correctness, lazy-loaded SDK, mobile-clipping root fix).
  Status: Complete

- Phase: 005 - Production hardening, docs, and demo prep
  Outcome: Runtime/deploy config, Node/license metadata, SDK 3.2.0 bump, unshield recovery, auto-rehide, typed error UX, dApp-first docs, add-a-pair guide, and demo script.
  Status: Complete

## Now

- Phase: 006 - Ship gate: deploy, UAT, submission
  Outcome: Deploy to a public Sepolia URL on Vercel, run the funded-wallet UAT including the WETH 18/6 decimals gate and reload-mid-unshield recovery, record the real-voice demo, and submit to the Zama Developer Program before 2026-07-07 23:59 AOE.
  Status: In progress. Live Vercel deployment is available at `https://veylbase.vercel.app`; funded-wallet UAT, demo recording, and portal submission remain.

## Later

- Phase: 007 - Optional post-submission hardening
  Outcome: CI, WalletConnect/multi-wallet support, stricter CSP after live host confirmation, screenshot automation, and deeper execution-path tests.
  Status: Optional.
