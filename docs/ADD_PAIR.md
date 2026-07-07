# Add a Pair

There are three ways a new ERC-20 ↔ ERC-7984 pair reaches Veylbase, ordered
from zero-effort to fully curated. Pick the tier that matches who controls the
pair.

## Tier 1 — Registered in the on-chain wrapper registry (automatic)

If the pair is registered in Zama's wrapper registry on Sepolia
(`0x2f0750Bbb0A246059d80e94c454586a7F27a128e`), Veylbase surfaces it with **no
code change**. On every `live=true` load, `src/server/registry/service.ts`
reconciles the curated snapshot against live registry reads and appends any
unknown pairs with their live token metadata:

- id `onchain-<address-prefix>`, source `onchain-registry`
- wrap/unwrap enabled when the registry marks the pair valid
- balance decryption always enabled; faucet disabled (unknown mint policy)

Verify:

```bash
curl "http://localhost:3000/api/registry?live=true"      # pair appears
curl "http://localhost:3000/api/registry/validate?live=true"  # checks still pass
```

## Tier 2 — Curated official pair (typed snapshot)

For a pair that should ship with names, faucet policy, and badges, add a
definition to `OFFICIAL_SEPOLIA_PAIR_DEFINITIONS` in
`src/lib/registry/official-sepolia.ts`:

1. Set `assetKey` (uppercase grouping key), underlying + confidential
   `name`/`symbol`, and both deployed Sepolia addresses.
2. Set `mintMode: "public"` **only** if the underlying exposes a public
   `mint(address,uint256)` (the faucet tab and 1,000,000/call cap key off it);
   otherwise `"restricted"`.
3. Flag `mock` / `testOnly` so the asset sheet renders the right tags.
4. Update the counts pinned in `src/lib/registry/official-sepolia.test.ts`
   (currently 8 total / 7 public-mint) and run:

   ```bash
   npm run typecheck && npm run test
   ```

The `/api/registry/validate` thresholds are `>=`, so adding pairs keeps them
green; only removals fail. Decimals are read live on-chain — do not hardcode
them in the snapshot.

## Tier 3 — Local dev pair (config only, no code)

For testing a wrapper you just deployed without touching the snapshot:

1. `cp config/registry.local.example.json config/registry.local.json`
2. Set a unique top-level `id` (e.g. `local-usdz-sepolia`) and `assetKey`.
3. Fill `underlying` (address, name, symbol, decimals) and `confidential`
   (ERC-7984 wrapper address, name, symbol, decimals).
4. Use `mint.mode: "public"` + `perCallLimitTokens` only for a real public
   mint function.

Local pairs merge **after** official pairs and are dropped when the underlying
address duplicates an official pair.

## Verify any tier

```bash
npm run dev
```

Then in `/app`: the pair appears in the asset sheet; faucet mints (public
tier only); shield an amount — if public and confidential decimals differ,
the receipt shows the flooring refund row; reveal decrypts via the permit
signature; unshield completes the two-step request → finalize flow.

## Gotchas

- Addresses must be real, checksummable Sepolia addresses.
- Public and confidential decimals can differ (WETH is 18 → 6). Shielding
  floors to the confidential precision and the UI shows the refund row.
- Do not commit `config/registry.local.json` with throwaway addresses unless
  that is intentional for the demo.
