# Plan

## Outcome

The app opens directly into a polished Veylbase product shell where a judge can inspect registry coverage, see wallet/network readiness, choose a wrapper pair, preview faucet/wrap/unwrap/decrypt flows, and understand transaction status states.

## Scope

Included:

- Replace backend placeholder home page with the first usable app UI.
- Apply the confirmed Veylbase brand direction: "Veil + base", descriptor "The confidential wrapper registry for Zama.", and no unapproved shorthand.
- Reconcile UI UX Pro Max recommendations with the Zama palette: `#FFD208`, `#FFD400`, `#FFC700`, `#000000`, `#2D2D2D`, `#F4F4F4`, `#FFFFFF`.
- Load registry, faucet, validation, and sample transaction-plan data.
- Build responsive product layout:
  - top navigation/wallet status area
  - wallet/network summary
  - registry explorer with search/filter
  - selected-pair action panel
  - confidential holdings/decrypt preview
  - faucet entry point
  - transaction step timeline
  - source health and validation badges
- Use UI UX Pro Max design system and 21st.dev/Magic selectively for component inspiration.
- Add basic loading, error, empty, and mobile states.
- Verify visually and with automated checks.

Excluded:

- Real wallet connection.
- Real transaction submission.
- Final demo script/article.
- Deployment.

## Steps

1. Read `design-system/veylbase/MASTER.md` and apply `design-system/veylbase/pages/home.md` as the page override.
2. Define brand/theme tokens in `src/app/globals.css` using the Zama yellow and neutral system.
3. Define a compact UI data model that adapts existing API responses for components.
4. Build page sections/components for registry, selected pair actions, wallet summary, faucet, confidential balance preview, and transaction timeline.
5. Wire page data from backend APIs or server-side service calls.
6. Add responsive behavior and loading/error states.
7. Run typecheck, lint, tests, build.
8. Run browser screenshot checks across desktop and mobile.
9. Update `STATE.md` and Phase 002 verification.

## Verification

- Check: `npm run typecheck`
  Expected: Pass.

- Check: `npm run lint`
  Expected: Pass.

- Check: `npm run test`
  Expected: Pass.

- Check: `npm run build`
  Expected: Pass.

- Check: Browser visual verification
  Expected: Desktop and mobile render non-overlapping product UI with clear primary flows.

- Check: API-driven UI smoke
  Expected: Registry count shows 8, faucet-ready count shows 7, validation status is visible, and a selected pair shows transaction steps.

- Check: Brand-language smoke
  Expected: UI and updated docs use Veylbase and the official descriptor, with no unapproved shorthand.

## Rollback

Revert Phase 002 UI edits to `src/app/page.tsx`, `src/app/globals.css`, and any new UI component files. Backend APIs and Phase 001 artifacts should remain intact.
