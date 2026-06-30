# UAT

## Scenario

A reviewer opens the repo and the locally-built app and confirms Veylbase looks and reads like a finished, production-ready submission — before any wallet is connected.

1. README opens with a clear pitch, a live-demo placeholder, screenshots, feature list, architecture, run/env instructions, an add-a-pair guide, a security model, and a license. `LICENSE` and `.env.example` exist.
2. `npm run build && npm run start` → `/` and `/app` render cleanly; no console errors at idle; security headers present and NO COOP/COEP.
3. The action card shows readable error copy on a forced failure and never hangs on "Working..."; a revealed balance (local-config/mock) re-hides after ~8s; a synthetic pending unshield surfaces a "Resume pending unshield" banner.
4. `docs/DEMO.md` contains a ~3-minute, beat-by-beat demo script anyone could record from.

## Result

Not run (phase is planned).

## Notes

- This phase's UAT is wallet-free. The confidential flows themselves (faucet → shield → reveal → unshield) are accepted in Phase 006's funded-wallet UAT.
- The auto-rehide and resume-unshield behaviors are verified here only structurally (effect fires, banner gates); their on-chain correctness is part of the Phase 006 gate (E06).
