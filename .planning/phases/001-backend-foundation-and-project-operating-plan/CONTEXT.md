# Context

## Goal

Record the completed backend foundation and establish durable GSD Hybrid state for Veylbase.

## Relevant Files

- Path: `package.json`
  Why it matters: Defines Next, Zama SDK, viem, zod, and verification scripts.

- Path: `src/lib/registry/official-sepolia.ts`
  Why it matters: Holds the official Zama Sepolia wrapper snapshot used for guaranteed bounty coverage.

- Path: `src/server/registry/service.ts`
  Why it matters: Merges official, local, and optional on-chain registry sources into the app snapshot.

- Path: `src/server/registry/onchain.ts`
  Why it matters: Reads the live Zama wrappers registry through Zama SDK and viem.

- Path: `src/server/transactions/planner.ts`
  Why it matters: Converts user intents into ordered wallet, contract, and SDK steps.

- Path: `src/app/api`
  Why it matters: Exposes the backend contract for the future UI.

- Path: `design-system/veylbase/MASTER.md`
  Why it matters: Persisted UI UX Pro Max design baseline for the upcoming frontend phase.

- Path: `README.md`
  Why it matters: Current architecture and API handoff docs.

## Decisions

- Decision: Keep wallet-authorized writes client-side and make the backend a planner/validator.
  Reason: dApp users must authorize approvals, wraps, decrypt permits, and unwrap finalization with their own wallet.

- Decision: Use official static Zama Sepolia data plus live reconciliation.
  Reason: Judges need reliable coverage even if public RPC is unavailable, but live registry status should remain available.

- Decision: Support local config for dev-only pairs.
  Reason: The challenge explicitly values extensibility and adding new pairs.

- Decision: Keep the package/project spelling as Veylbase and do not record a pronunciation shorthand yet.
  Reason: The shared conversation snapshot does not provide a reliable naming update, so the plan should avoid an invented shorthand.

## Risks

- Risk: Public RPC reliability could affect live registry reconciliation.
  Mitigation: Use the official static snapshot as fallback and expose source health/warnings.

- Risk: SDK wallet integration details may change or require specific client setup.
  Mitigation: Keep server APIs SDK-aware but transaction-submission-free; implement wallet flows in a dedicated phase.

- Risk: No git repository is initialized.
  Mitigation: Surface this in state and avoid destructive commands; initialize git only if the user wants it.
