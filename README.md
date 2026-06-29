# Veylbase

Veylbase is the confidential wrapper registry for Zama: a production-ready Developer Program Bounty Track dApp for Sepolia ERC-20 to ERC-7984 pairs.

## Backend Architecture

- `src/lib/registry/official-sepolia.ts` stores the current official Sepolia wrapper snapshot from Zama protocol-apps.
- `src/server/registry/onchain.ts` reads the live on-chain wrappers registry through `@zama-fhe/sdk` and viem.
- `src/server/registry/service.ts` merges official, on-chain, and optional local config into one typed registry snapshot.
- `src/server/transactions/planner.ts` builds judge-friendly plans for faucet minting, wrap, unwrap, finalization, and EIP-712 balance decryption.
- `config/registry.local.example.json` documents how to add dev-only pairs without polluting the official snapshot.

## API

- `GET /api/registry?live=true` returns the registry snapshot and optionally reconciles it with the on-chain registry.
- `GET /api/registry/validate?live=true` returns challenge coverage checks.
- `GET /api/faucet` returns public mintable mock pairs.
- `POST /api/transactions/plan` returns ordered wallet/SDK steps for:
  - `claimFaucet`
  - `wrap`
  - `unwrap`
  - `finalizeUnwrap`
  - `decryptBalance`

Amounts are always base-unit integer strings. Token decimals should be read from chain metadata at runtime.

## Local Config

Copy `config/registry.local.example.json` to `config/registry.local.json`, then replace the addresses and metadata. Local pairs are merged after the official snapshot and are skipped if they duplicate an official underlying token.

## Scripts

```bash
npm run dev
npm run typecheck
npm run lint
npm run test
```

## Sources

- Zama protocol-apps Sepolia addresses: https://raw.githubusercontent.com/zama-ai/protocol-apps/main/docs/addresses/testnet/sepolia.md
- Zama wrappers registry docs: https://github.com/zama-ai/protocol-apps/blob/main/docs/wrapper-registry.md
- Zama confidential wrapper docs: https://github.com/zama-ai/protocol-apps/blob/main/docs/confidential-wrapper.md
