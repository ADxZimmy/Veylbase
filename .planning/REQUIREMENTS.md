# Requirements

## Functional

- Requirement: Browse official Sepolia ERC-20 <-> ERC-7984 wrapper pairs.
  Acceptance: `/api/registry` returns all 8 official Sepolia pairs and can reconcile with the live on-chain registry using `live=true`.

- Requirement: Surface all public mock faucet pairs.
  Acceptance: `/api/faucet` returns 7 public mintable mock pairs with mint function guidance.

- Requirement: Plan wrap from ERC-20 to ERC-7984.
  Acceptance: `/api/transactions/plan` with `intent=wrap` returns ordered steps for wallet check, balance read, ERC-20 approval, and wrapper `wrap`/SDK `shield`.

- Requirement: Plan unwrap from ERC-7984 to ERC-20.
  Acceptance: planner returns encryption, unwrap request, event wait, and finalize/unshield guidance.

- Requirement: Plan EIP-712 user decryption for any ERC-7984 token.
  Acceptance: planner supports `decryptBalance` by `pairId` or arbitrary `confidentialTokenAddress`.

- Requirement: Support dev-only/custom pairs.
  Acceptance: `config/registry.local.example.json` documents local extension, and the registry service merges local pairs without replacing official pairs.

- Requirement: Provide a judge-verifiable coverage endpoint.
  Acceptance: `/api/registry/validate` returns pass/fail checks for official pair coverage, faucet coverage, wrap/unwrap capabilities, decrypt coverage, and duplicate addresses.

- Requirement: Build a polished production UI.
  Acceptance: first screen is the working dApp, not a marketing landing page. It includes wallet/network state, registry explorer, selected-pair action surface, faucet flow, wrap/unwrap flow, decrypt flow, and transaction/activity states.

- Requirement: Preserve Veylbase brand clarity.
  Acceptance: UI, docs, and planning refer to the product as Veylbase with the descriptor "The confidential wrapper registry for Zama."; no unapproved shorthand appears.

- Requirement: Follow Zama-aligned visual language.
  Acceptance: UI uses `#FFD208` as the primary brand accent, black/graphite/light-gray/white neutrals as the base system, and reserves yellow for CTAs, active states, decryption affordances, badges, focus, and verified-registry emphasis.

## Non-Functional

- Requirement: Production readiness.
  Acceptance: typecheck, tests, lint, build, and endpoint smoke tests pass before handoff.

- Requirement: UX clarity under blockchain uncertainty.
  Acceptance: UI explains pending wallet signatures, network mismatch, approval, transaction pending, failed transaction, decrypted versus hidden balances, and live registry source status.

- Requirement: Extensibility.
  Acceptance: adding a pair requires local config only, without editing core service logic.

- Requirement: Accessibility and responsiveness.
  Acceptance: primary flows work at mobile and desktop sizes, keyboard focus is visible, contrast is readable, controls have clear labels, and layout avoids overlap.

- Requirement: Security.
  Acceptance: no server-side private-key custody, no secrets in committed files, no transaction submission without wallet authority, and no hidden global installer/hooks.

## Out Of Scope

- Mainnet transaction support for the first bounty submission.
- Custodial wallet features.
- Backend database persistence.
- Real-value faucet or production token minting.
- Admin registry write actions to the official on-chain registry.

## Open Questions

- Question: What final public deployment target will be used?
  Status: Open. Vercel is likely, but not yet chosen.

- Question: Which wallet connector stack should be used for the UI?
  Status: Open. Candidate path is wagmi/viem plus Zama React SDK, but this should be verified before implementation.

- Question: What exact public pronunciation should be used in demo narration?
  Status: Open. Brand meaning is confirmed as "Veil + base"; do not introduce a shorthand until confirmed.

- Question: Will a local hardhat/dev registry be required for demo fallback?
  Status: Open. Current architecture supports local config; smart-contract deployment scripts are not in scope yet.
