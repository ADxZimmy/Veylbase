# UAT

## Scenario

A reviewer opens the repo and a locally-built production app and confirms Veylbase reads like a finished submission before any wallet is connected.

1. README opens with the product journey, local setup, architecture, API, Sepolia/Zama runtime notes, add-a-pair guide, demo script link, Known limitations, and license.
2. `.env.example`, `LICENSE`, `docs/ADD_PAIR.md`, and `docs/DEMO.md` exist.
3. `npm run build && npm run start` renders `/` and `/app`.
4. Response headers include `Referrer-Policy` and `X-Content-Type-Options`, and do not include COOP/COEP.
5. The code path for pending unshield, auto-rehide, typed relayer/runtime errors, retry, and running timeout is present and passes typecheck/lint.

## Result

Passed for wallet-free Phase 005 scope.

## Notes

- Production smoke was run on port 3029 after the final build: `/` 200, `/app` 200, security headers present, COOP/COEP absent.
- Error copy was covered by unit tests; live relayer/CDN failure copy must still be exercised in Phase 006 UAT case E05.
- Auto-rehide and pending-unshield recovery are structurally verified but require a funded wallet to prove end to end in Phase 006 cases T06/T08/E06.
- Wallet-free screenshots were not captured in this pass; capture final assets during Phase 006 deployment/UAT.
