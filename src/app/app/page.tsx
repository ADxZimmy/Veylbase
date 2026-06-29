import type { RegistryPair } from "@/lib/registry/types";
import { getRegistrySnapshot } from "@/server/registry/service";
import type { UiRegistryPair, UiRegistrySnapshot } from "../app-types";
import { VeylbaseAppShell } from "../veylbase-app-shell";

export const dynamic = "force-dynamic";

/** Trim the "Mock" suffix used in the snapshot symbols (USDCMock -> USDC). */
function cleanSymbol(value: string) {
  return value.replace(/Mock$/u, "");
}

function isTestOnly(pair: RegistryPair) {
  return pair.notes.some((note) =>
    /only for testing|not the real/iu.test(note)
  );
}

function toUiPair(pair: RegistryPair): UiRegistryPair {
  return {
    id: pair.id,
    symbol: cleanSymbol(pair.underlying.symbol),
    confidentialSymbol: cleanSymbol(pair.confidential.symbol),
    name: pair.underlying.name,
    decimals: pair.underlying.decimals,
    underlyingAddress: pair.underlying.address,
    confidentialAddress: pair.confidential.address,
    faucet: pair.capabilities.faucet,
    mock: pair.mock,
    testOnly: isTestOnly(pair)
  };
}

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
