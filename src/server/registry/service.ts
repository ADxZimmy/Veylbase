import type { Address } from "viem";
import { addressKey } from "@/lib/addresses";
import { SEPOLIA_CHAIN } from "@/lib/chains";
import { OFFICIAL_SEPOLIA_PAIRS } from "@/lib/registry/official-sepolia";
import type {
  RegistryCoverage,
  RegistryPair,
  RegistrySnapshot,
  RegistrySourceHealth
} from "@/lib/registry/types";
import { loadLocalRegistryPairs } from "@/server/registry/local-config";
import {
  getOnchainRegistryPage,
  type SerializableOnchainPair
} from "@/server/registry/onchain";

interface RegistrySnapshotOptions {
  includeLocal?: boolean;
  live?: boolean;
  page?: number;
  pageSize?: number;
}

function pairKey(pair: RegistryPair) {
  return addressKey(pair.underlying.address);
}

function createBareOnchainPair(pair: SerializableOnchainPair): RegistryPair {
  const symbol = pair.underlying?.symbol ?? "UNKNOWN";
  const confidentialSymbol = pair.confidential?.symbol ?? "cUNKNOWN";

  return {
    id: `onchain-${pair.tokenAddress.slice(2, 10).toLowerCase()}`,
    chainId: SEPOLIA_CHAIN.chainId,
    network: "sepolia",
    registryAddress: SEPOLIA_CHAIN.registryAddress,
    source: "onchain-registry",
    sourceUrl: SEPOLIA_CHAIN.explorerUrl,
    official: false,
    valid: pair.isValid,
    mock: false,
    assetKey: symbol,
    underlying: {
      address: pair.tokenAddress,
      name: pair.underlying?.name ?? "Unknown ERC-20",
      symbol,
      decimals: pair.underlying?.decimals ?? null,
      standard: "ERC20",
      mint: { mode: "unknown" }
    },
    confidential: {
      address: pair.confidentialTokenAddress,
      name: pair.confidential?.name ?? "Unknown confidential token",
      symbol: confidentialSymbol,
      decimals: pair.confidential?.decimals ?? null,
      standard: "ERC7984",
      wrapper: true
    },
    capabilities: {
      faucet: false,
      wrap: pair.isValid,
      unwrap: pair.isValid,
      decrypt: true,
      transfer: true
    },
    notes: ["Discovered from the on-chain wrappers registry."]
  };
}

function mergePairs(pairs: RegistryPair[]) {
  const merged = new Map<string, RegistryPair>();
  const warnings: string[] = [];

  for (const pair of pairs) {
    const key = pairKey(pair);
    const existing = merged.get(key);

    if (existing) {
      warnings.push(
        `Duplicate underlying token ${pair.underlying.address}: kept ${existing.id}, skipped ${pair.id}.`
      );
      continue;
    }

    merged.set(key, pair);
  }

  return { pairs: [...merged.values()], warnings };
}

function reconcileOnchain(
  pairs: RegistryPair[],
  onchainPairs: SerializableOnchainPair[]
) {
  const byUnderlying = new Map(pairs.map((pair) => [pairKey(pair), pair]));
  const reconciled = [...pairs];
  const warnings: string[] = [];

  for (const onchainPair of onchainPairs) {
    const key = addressKey(onchainPair.tokenAddress);
    const known = byUnderlying.get(key);

    if (!known) {
      const discovered = createBareOnchainPair(onchainPair);
      byUnderlying.set(key, discovered);
      reconciled.push(discovered);
      continue;
    }

    known.valid = onchainPair.isValid;
    known.confidential.address = onchainPair.confidentialTokenAddress;
    known.capabilities.wrap = onchainPair.isValid;
    known.capabilities.unwrap = onchainPair.isValid;

    if (onchainPair.underlying) {
      known.underlying.name = onchainPair.underlying.name;
      known.underlying.symbol = onchainPair.underlying.symbol;
      known.underlying.decimals = onchainPair.underlying.decimals;
    }

    if (onchainPair.confidential) {
      known.confidential.name = onchainPair.confidential.name;
      known.confidential.symbol = onchainPair.confidential.symbol;
      known.confidential.decimals = onchainPair.confidential.decimals;
    }

    if (
      addressKey(known.confidential.address) !==
      addressKey(onchainPair.confidentialTokenAddress)
    ) {
      warnings.push(
        `Confidential token mismatch for ${known.id}; live registry value was applied.`
      );
    }
  }

  return { pairs: reconciled, warnings };
}

function coverageFor(pairs: RegistryPair[]): RegistryCoverage {
  return {
    totalPairs: pairs.length,
    officialPairs: pairs.filter((pair) => pair.official).length,
    localPairs: pairs.filter((pair) => pair.source === "local-config").length,
    validPairs: pairs.filter((pair) => pair.valid).length,
    publicMintPairs: pairs.filter((pair) => pair.underlying.mint.mode === "public")
      .length,
    restrictedMintPairs: pairs.filter(
      (pair) => pair.underlying.mint.mode === "restricted"
    ).length,
    decryptablePairs: pairs.filter((pair) => pair.capabilities.decrypt).length
  };
}

function staticHealth(): RegistrySourceHealth {
  return {
    source: "static-fallback",
    status: "loaded",
    detail:
      "Loaded official Sepolia wrapper pairs from the checked-in Zama protocol-apps snapshot.",
    updatedAt: new Date().toISOString()
  };
}

export async function getRegistrySnapshot(
  options: RegistrySnapshotOptions = {}
): Promise<RegistrySnapshot> {
  const health: RegistrySourceHealth[] = [staticHealth()];
  const warnings: string[] = [];
  const local = options.includeLocal === false ? { pairs: [], health: undefined } : await loadLocalRegistryPairs();

  if (local.health) {
    health.push(local.health);
  }

  const merged = mergePairs([...OFFICIAL_SEPOLIA_PAIRS, ...local.pairs]);
  let pairs = merged.pairs;
  warnings.push(...merged.warnings);

  if (options.live) {
    try {
      const live = await getOnchainRegistryPage({
        page: options.page,
        pageSize: options.pageSize,
        metadata: true
      });
      const reconciled = reconcileOnchain(pairs, live.items);
      pairs = reconciled.pairs;
      warnings.push(...reconciled.warnings);
      health.push({
        source: "onchain-registry",
        status: "loaded",
        detail: `Loaded ${live.items.length}/${live.total} pair(s) from ${live.registryAddress}.`,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      health.push({
        source: "onchain-registry",
        status: "failed",
        detail:
          error instanceof Error
            ? error.message
            : "Unable to read the on-chain wrappers registry.",
        updatedAt: new Date().toISOString()
      });
      warnings.push(
        "Live on-chain registry read failed; API returned the official static snapshot plus local config."
      );
    }
  } else {
    health.push({
      source: "onchain-registry",
      status: "skipped",
      detail: "Pass live=true to reconcile against the on-chain wrappers registry.",
      updatedAt: new Date().toISOString()
    });
  }

  return {
    chain: {
      id: "sepolia",
      name: SEPOLIA_CHAIN.name,
      chainId: SEPOLIA_CHAIN.chainId,
      gatewayChainId: SEPOLIA_CHAIN.gatewayChainId,
      registryAddress: SEPOLIA_CHAIN.registryAddress,
      explorerUrl: SEPOLIA_CHAIN.explorerUrl
    },
    pairs,
    coverage: coverageFor(pairs),
    sourceHealth: health,
    warnings
  };
}

export async function findPairById(
  id: string,
  options?: RegistrySnapshotOptions
) {
  const snapshot = await getRegistrySnapshot(options);
  return snapshot.pairs.find((pair) => pair.id === id);
}

export async function findPairByConfidentialAddress(
  address: Address,
  options?: RegistrySnapshotOptions
) {
  const snapshot = await getRegistrySnapshot(options);
  return snapshot.pairs.find(
    (pair) => addressKey(pair.confidential.address) === addressKey(address)
  );
}
