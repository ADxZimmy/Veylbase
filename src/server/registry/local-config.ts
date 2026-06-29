import { readFile } from "node:fs/promises";
import path from "node:path";
import { SEPOLIA_CHAIN } from "@/lib/chains";
import {
  localRegistryConfigSchema,
  type LocalRegistryPairInput
} from "@/lib/registry/schema";
import type { RegistryPair, RegistrySourceHealth } from "@/lib/registry/types";

const LOCAL_REGISTRY_PATH = path.join(process.cwd(), "config", "registry.local.json");

function localInputToPair(input: LocalRegistryPairInput): RegistryPair {
  return {
    id: input.id,
    chainId: SEPOLIA_CHAIN.chainId,
    network: "sepolia",
    registryAddress: SEPOLIA_CHAIN.registryAddress,
    source: "local-config",
    sourceUrl: LOCAL_REGISTRY_PATH,
    official: false,
    valid: input.valid,
    mock: input.mock,
    assetKey: input.assetKey,
    underlying: {
      ...input.underlying,
      standard: "ERC20"
    },
    confidential: {
      ...input.confidential,
      standard: "ERC7984",
      wrapper: true
    },
    capabilities: {
      faucet: input.underlying.mint.mode === "public",
      wrap: input.valid,
      unwrap: input.valid,
      decrypt: true,
      transfer: true
    },
    notes: input.notes
  };
}

export async function loadLocalRegistryPairs(): Promise<{
  pairs: RegistryPair[];
  health: RegistrySourceHealth;
}> {
  const updatedAt = new Date().toISOString();

  try {
    const raw = await readFile(LOCAL_REGISTRY_PATH, "utf8");
    const parsed = localRegistryConfigSchema.parse(JSON.parse(raw));

    return {
      pairs: parsed.pairs.map(localInputToPair),
      health: {
        source: "local-config",
        status: "loaded",
        detail: `${parsed.pairs.length} local pair(s) loaded from config/registry.local.json`,
        updatedAt
      }
    };
  } catch (error) {
    const code =
      typeof error === "object" && error !== null && "code" in error
        ? String((error as { code: unknown }).code)
        : "";

    if (code === "ENOENT") {
      return {
        pairs: [],
        health: {
          source: "local-config",
          status: "skipped",
          detail: "No config/registry.local.json file found; using official pairs only.",
          updatedAt
        }
      };
    }

    return {
      pairs: [],
      health: {
        source: "local-config",
        status: "failed",
        detail:
          error instanceof Error
            ? error.message
            : "Unable to read local registry config.",
        updatedAt
      }
    };
  }
}
