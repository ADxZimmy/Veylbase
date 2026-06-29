import { WrappersRegistry, type TokenWrapperPairWithMetadata } from "@zama-fhe/sdk";
import { ViemProvider } from "@zama-fhe/sdk/viem";
import { createPublicClient, http, type Address } from "viem";
import { sepolia as viemSepolia } from "viem/chains";
import { resolveSepoliaRpcUrl, SEPOLIA_CHAIN } from "@/lib/chains";

export interface OnchainRegistryPageOptions {
  page?: number;
  pageSize?: number;
  metadata?: boolean;
}

export interface SerializableOnchainPair {
  tokenAddress: Address;
  confidentialTokenAddress: Address;
  isValid: boolean;
  underlying?: {
    name: string;
    symbol: string;
    decimals: number;
    totalSupply: string;
  };
  confidential?: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

function createRegistry() {
  const publicClient = createPublicClient({
    chain: viemSepolia,
    transport: http(resolveSepoliaRpcUrl())
  });

  const provider = new ViemProvider({ publicClient });

  return new WrappersRegistry({
    provider,
    registryAddresses: {
      [SEPOLIA_CHAIN.chainId]: SEPOLIA_CHAIN.registryAddress
    },
    registryTTL: 300
  });
}

function hasMetadata(
  pair: unknown
): pair is TokenWrapperPairWithMetadata {
  return (
    typeof pair === "object" &&
    pair !== null &&
    "underlying" in pair &&
    "confidential" in pair
  );
}

export async function getOnchainRegistryPage(options: OnchainRegistryPageOptions = {}) {
  const registry = createRegistry();
  const result = await registry.listPairs({
    page: options.page ?? 1,
    pageSize: options.pageSize ?? 100,
    metadata: options.metadata ?? true
  });

  return {
    registryAddress: await registry.getRegistryAddress(),
    total: result.total,
    page: result.page,
    pageSize: result.pageSize,
    items: result.items.map((pair): SerializableOnchainPair => {
      if (hasMetadata(pair)) {
        return {
          tokenAddress: pair.tokenAddress,
          confidentialTokenAddress: pair.confidentialTokenAddress,
          isValid: pair.isValid,
          underlying: {
            name: pair.underlying.name,
            symbol: pair.underlying.symbol,
            decimals: pair.underlying.decimals,
            totalSupply: pair.underlying.totalSupply.toString()
          },
          confidential: {
            name: pair.confidential.name,
            symbol: pair.confidential.symbol,
            decimals: pair.confidential.decimals
          }
        };
      }

      return {
        tokenAddress: pair.tokenAddress,
        confidentialTokenAddress: pair.confidentialTokenAddress,
        isValid: pair.isValid
      };
    })
  };
}
