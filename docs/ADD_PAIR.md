# Add A Local Pair

Use local pairs when you want to test a deployed Sepolia wrapper without changing the official snapshot in `src/lib/registry/official-sepolia.ts`.

## Steps

1. Copy the example file:

   ```bash
   cp config/registry.local.example.json config/registry.local.json
   ```

2. Set a unique top-level `id`, for example `local-usdz-sepolia`.

3. Set `assetKey` to the uppercase grouping key you want in the asset sheet.

4. Fill `underlying` with a deployed Sepolia ERC-20 address, name, symbol, and decimals.

5. Use `mint.mode: "public"` only when the underlying token exposes a public `mint(address,uint256)` function. Set `perCallLimitTokens` to the intended human-unit cap.

6. Fill `confidential` with the deployed ERC-7984 wrapper address, name, symbol, and decimals.

7. Run the app and verify:

   ```bash
   npm run dev
   ```

   Then open `/app`, use the asset sheet, and call:

   ```bash
   curl "http://localhost:3000/api/registry?live=true"
   curl "http://localhost:3000/api/registry/validate?live=true"
   ```

## Gotchas

- Addresses must be real, checksummable Sepolia addresses.
- Local pairs merge after official pairs and are dropped when the underlying address duplicates an official pair.
- Public and confidential decimals can differ. Shielding floors to the confidential precision and the UI shows the refund row.
- Do not commit `config/registry.local.json` with private or throwaway addresses unless that is intentional for the demo.
