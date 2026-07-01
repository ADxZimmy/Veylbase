# Veylbase

Veylbase is a Sepolia dApp for Zama confidential wrappers. It lets a user pick a public ERC-20, mint test tokens when the pair supports it, shield into an ERC-7984 confidential balance, reveal that private balance only when they choose, and unshield back to public tokens.

Built for the Zama Developer Program, the app is intentionally UX-first: the public site explains the privacy story, while `/app` is the focused wallet surface for the live token flows.

## Links

- Source: https://github.com/ADxZimmy/Veylbase
- Live dApp: https://veylbase.vercel.app

## What You Can Do

- Enter the dApp from the landing page and connect an injected EVM wallet.
- Switch to Sepolia when needed, without exposing chain/debug clutter in the main journey.
- Mint public mock test tokens for faucet-enabled pairs.
- Shield public ERC-20 balances into confidential wrapper balances.
- Reveal encrypted balances with a wallet signature, not an on-chain transaction.
- Unshield confidential balances through the SDK's two-step unwrap and finalize flow.
- Open the developer plan drawer when you want the exact contract calls and SDK methods.

## Local Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`, then choose **Enter dApp**.

`NEXT_PUBLIC_SEPOLIA_RPC_URL` is optional but recommended for demo/UAT. Use a Sepolia RPC URL from Alchemy, Infura, dRPC, or a similar provider. Because the value is public browser config, restrict the key by domain/referrer and redeploy after changing it.

## Scripts

```bash
npm run typecheck
npm run lint
npm run test
npm run build
npm run start
```

Node is pinned to `24.x` through `package.json` engines for Vercel and local parity.

## Architecture

- `src/app/page.tsx` is the public landing page.
- `src/app/app/page.tsx` loads the registry snapshot for the dApp shell.
- `src/app/veylbase-app-shell.tsx` owns the wallet journey, action tabs, balance reveal state, recovery prompts, and activity feed.
- `src/app/confidential-actions.ts` is the lazy-loaded execution bridge for Zama SDK actions.
- `src/server/registry/service.ts` merges the official snapshot, live on-chain registry reads, and optional local dev pairs.
- `src/server/transactions/planner.ts` builds the developer-plan drawer for faucet, shield, reveal, and unshield flows.

## API

- `GET /api/registry?live=true` returns the registry snapshot and can reconcile with the on-chain registry.
- `GET /api/registry/validate?live=true` returns coverage checks for judges and maintainers.
- `GET /api/faucet` lists public-mintable mock pairs.
- `POST /api/transactions/plan` returns ordered wallet/SDK steps for `claimFaucet`, `wrap`, `unwrap`, `finalizeUnwrap`, and `decryptBalance`.

Amounts are base-unit integer strings at the API boundary. The UI formats values with live token metadata, including separate public and confidential decimals.

## Sepolia And Zama Runtime

The confidential execution path uses `@zama-fhe/sdk` `^3.2.0` and the SDK's Sepolia preset. In the installed package, that preset resolves to:

- Sepolia chain: `11155111`
- Gateway chain: `10901`
- Relayer: `https://relayer.testnet.zama.org/v2`
- Registry: `0x2f0750Bbb0A246059d80e94c454586a7F27a128e`

The browser SDK loads its runtime from `cdn.zama.org`, uses a blob worker, and runs through `web()` without threaded mode. Do not add COOP/COEP headers for this submission path; they can block runtime fetches or wallet popups. The app currently ships only `Referrer-Policy` and `X-Content-Type-Options`.

`src/lib/chains.ts` still contains display-only registry metadata inherited from earlier planning (`gatewayChainId: 55815`, `relayer.testnet.zama.cloud`). Confidential execution does not use those values; Phase 006 UAT should confirm live Network-tab traffic before changing the displayed constants.

## Add A Local Pair

Use [docs/ADD_PAIR.md](docs/ADD_PAIR.md) to add dev-only pairs through `config/registry.local.json`. Local pairs merge after the official Sepolia snapshot and are ignored when they duplicate an official underlying token.

## Demo

Use [docs/DEMO.md](docs/DEMO.md) for the 3-minute recording plan. The program requires a real-person voiceover; subtitles are encouraged. Pre-fund the wallet and pre-mint tokens before recording.

## Known Limitations

- Funded-wallet UAT and final connected-state screenshots are Phase 006 tasks. The app must still be proven against a live relayer with faucet, shield, reveal, and unshield transactions before submission.
- If a user switches networks while a wallet transaction is mid-flow, the wallet/RPC may orphan that interaction. Veylbase clears local balances and plans on chain changes; pending unshield recovery covers the specific unwrap-submitted case once the hash is stored.
- Revealed confidential balances are session-only and auto-hide after a short window. The user can reveal again with another signature.
- If live confidential token decimals are unavailable, the reveal display falls back to 6 decimals. The registry tests cover populated metadata, but Phase 006 UAT should verify WETH-style 18 public / 6 confidential pairs end to end.
- The default public Sepolia RPC can be rate-limited. Use a dedicated, referrer-restricted `NEXT_PUBLIC_SEPOLIA_RPC_URL` for demo and deployment.

## License

MIT. See [LICENSE](LICENSE).

## Sources

- Zama protocol-apps Sepolia addresses: https://raw.githubusercontent.com/zama-ai/protocol-apps/main/docs/addresses/testnet/sepolia.md
- Zama wrappers registry docs: https://github.com/zama-ai/protocol-apps/blob/main/docs/wrapper-registry.md
- Zama confidential wrapper docs: https://github.com/zama-ai/protocol-apps/blob/main/docs/confidential-wrapper.md
