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

## Now

- Phase: 005 - Production hardening, docs, and demo prep
  Outcome: All wallet-free, deploy-free readiness: `.env.example` + dedicated RPC, Node pin, `next.config.ts` security headers (NO COOP/COEP), LICENSE, SDK `^3.2.0` bump, resilience/UX fixes (resume-interrupted-unshield, auto-rehide, typed error UX), a dApp-first README, the add-a-pair guide, and the ~3-minute demo script.
  Status: Planned — plan authored (`.planning/phases/005-production-hardening-docs-and-demo/`)

## Next

- Phase: 006 - Ship gate: deploy, UAT, submission
  Outcome: Deploy to a public Sepolia URL on Vercel, run the funded-wallet UAT (the make-or-break gate, incl. the WETH 18/6 decimals case), record the real-voice demo, and submit to the Zama Developer Program before 2026-07-07 23:59 AOE.
  Status: Planned — plan + funded-wallet runbook authored (`.planning/phases/006-ship-gate-deploy-uat-submission/`)

## Later

- None. Phase 006 is the ship gate; post-submission iteration (multi-wallet/WalletConnect, CI, accessibility audit, execution-path test coverage) would open a Phase 007 only if pursued.
