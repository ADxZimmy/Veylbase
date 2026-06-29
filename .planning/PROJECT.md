# Veylbase

## Mission

Build Veylbase as a production-ready Zama Confidential Wrapper Registry dApp for the Developer Program Bounty Track. The public descriptor is: "The confidential wrapper registry for Zama." The product should feel like an official confidential asset portal: users can browse ERC-20 <-> ERC-7984 wrapper pairs, claim mock tokens, wrap, unwrap, and decrypt confidential balances with a polished DeFi UX.

## Audience

- Zama bounty judges who need to verify coverage, correctness, extensibility, UX quality, code quality, and production readiness quickly.
- Developers who need a reliable reference app for official wrapper pairs and dev-only pair extension.
- End users testing confidential token flows on Sepolia who need clear wallet, network, transaction, and decryption guidance.

## System Shape

- Runtime: Node.js 24, Next.js 16 App Router, React 19, TypeScript.
- Styling: Tailwind v4 foundation, UI UX Pro Max design system persisted at `design-system/veylbase/MASTER.md`, with Veylbase/Zama brand overrides from `C:\Users\PC\Downloads\Veylbase.md`.
- Blockchain: Sepolia, Zama `@zama-fhe/sdk` and `@zama-fhe/react-sdk`, viem, official Zama wrappers registry.
- Data: no database yet. Registry data comes from a checked-in official Zama Sepolia snapshot, optional live on-chain registry reconciliation, and optional `config/registry.local.json` for dev-only pairs.
- API surface: Next route handlers under `src/app/api`.
- Deployment target: public web dApp, likely Vercel or another static/serverless Next host with Sepolia RPC configuration.

## Constraints

- Challenge deadline from shared context: July 7, 2026, 23:59 AOE.
- Public brand is Veylbase, from "Veil + base"; do not introduce shorthand or a pronunciation claim unless the user confirms it.
- Anchor the visual system on Zama yellow `#FFD208`, black `#000000`, graphite `#2D2D2D`, light gray `#F4F4F4`, and white `#FFFFFF`; use `#FFD400` and `#FFC700` only as accent state variants.
- Must support Sepolia.
- Must include all official cTokenMock pairs listed in Zama Sepolia wrapper docs.
- Must use the on-chain registry as source of truth where possible, with local config only as an extension layer.
- Must support arbitrary ERC-7984 balance decryption, not only registry pairs.
- Wallet-authorized actions must stay client-side. Server routes may plan and validate flows, but should not submit user transactions.
- Never store secrets, private keys, wallet signatures, or production credentials in `.planning/`, config examples, logs, or docs.

## Working Agreements

- Keep GSD Hybrid artifacts under `.planning/` current after each meaningful phase.
- Use `npm run typecheck`, `npm run test`, `npm run lint`, and `npm run build` as the default verification gate.
- Use UI UX Pro Max before frontend/layout/interaction work, per repo instruction.
- Use 21st.dev/Magic for component-level inspiration or components when it materially helps the UI.
- Prefer focused, phase-sized implementation loops with verification recorded in the active phase.
- Treat repo/docs/chat-derived requirements as product context, but verify current external facts when they can change.
