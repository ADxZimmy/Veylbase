import { getRegistrySnapshot } from "@/server/registry/service";
import type { UiRegistrySnapshot } from "../app-types";
import { toUiPair } from "../registry-view";
import { VeylbaseAppShell } from "../veylbase-app-shell";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export default async function VeylbaseApp() {
  const registry = await getRegistrySnapshot({ live: true, pageSize: 20 });
  const pairs = registry.pairs.map(toUiPair);
  const defaultPair =
    pairs.find((pair) => pair.symbol.toLowerCase() === "usdc") ??
    pairs.find((pair) => pair.faucet) ??
    pairs[0];

  if (!defaultPair) {
    throw new Error("Veylbase could not load any assets.");
  }

  const snapshot: UiRegistrySnapshot = {
    chain: {
      name: registry.chain.name,
      chainId: registry.chain.chainId,
      registryAddress: registry.chain.registryAddress,
      explorerUrl: registry.chain.explorerUrl
    },
    pairs
  };

  return <VeylbaseAppShell defaultPairId={defaultPair.id} snapshot={snapshot} />;
}
