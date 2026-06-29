# Home Page Override

## Purpose

Build `/` as the public Veylbase entry experience and `/app` as the wallet-connected product surface. Do not expose registry validation, network plumbing, contract details, API status, or backend process language on the landing page.

## Brand Rules

- Product name: Veylbase.
- Meaning: "Veil + base."
- Descriptor: "The confidential wrapper registry for Zama."
- Do not use shorthand in product copy unless the user explicitly confirms it.
- Anchor color: Zama yellow `#FFD208`.
- Yellow variants: `#FFD400` for hover/highlight, `#FFC700` for pressed/strong emphasis.
- Neutrals: `#000000`, `#2D2D2D`, `#F4F4F4`, `#FFFFFF`.

## Route Architecture

- `/`: Premium privacy-first landing page with brand, narrative, visual confidential-asset scene, and a clear `Enter dApp` CTA.
- `/app`: Functional dApp workspace for choosing assets, shielding, unshielding, revealing private balances, and getting test tokens.
- API and validation details stay available to judges through docs/endpoints, not as default product UI.

## Landing Page Rules

- The first viewport must feel like a product entry page, not a dashboard, registry table, block explorer, or admin console.
- Use one dominant offer: private token flows should feel ordinary.
- The primary action is `Enter dApp`.
- Do not show pair counts, source health, network names, addresses, checks, RPC state, SDK/planner details, or validation summaries.
- Use a visual confidential-asset scene as the hero background/setting; avoid split dashboard preview cards.

## dApp Rules

- The dApp can show asset choices and actions, but it should lead with the user task: Shield, Unshield, Reveal, or Get test tokens.
- Asset rows should show symbols and user-facing labels, not addresses by default.
- Network selection and wallet details belong behind wallet connection states, not as top-level page branding.
- Transaction progress copy must use user-facing steps such as connect, approve, shield, reveal, and receive.
- Hidden balances render as `&bull;&bull;&bull;&bull;&bull;&bull;` and require an explicit reveal action.

## Anti-Patterns

- No one-page app where landing, registry, validation, and transaction planner all appear together.
- No KPI/stat rows as the first product impression.
- No source-health badges, RPC labels, contract addresses, method names, base-unit language, SDK names, or planner language in visible app copy.
- No generic dashboard/card-soup composition.
- No blue/green default crypto palette.
- No decorative gradient orbs.
