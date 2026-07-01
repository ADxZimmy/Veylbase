import { NextResponse } from "next/server";
import { getRegistrySnapshot } from "@/server/registry/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function GET() {
  const snapshot = await getRegistrySnapshot({ live: false });
  const pairs = snapshot.pairs
    .filter((pair) => pair.capabilities.faucet)
    .map((pair) => ({
      pairId: pair.id,
      assetKey: pair.assetKey,
      underlying: pair.underlying,
      confidential: pair.confidential,
      mintFunction: "mint(address to,uint256 amount)",
      perCallLimitTokens: pair.underlying.mint.perCallLimitTokens ?? null
    }));

  return NextResponse.json({
    chain: snapshot.chain,
    pairs,
    note:
      "Amounts must be sent as base-unit integer strings because token decimals are read at runtime."
  });
}
