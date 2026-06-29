import type { Address } from "viem";

export type RegistryPairSource =
  | "official-zama-protocol-apps"
  | "onchain-registry"
  | "local-config";

export type MintMode = "public" | "restricted" | "none" | "unknown";

export interface MintPolicy {
  mode: MintMode;
  perCallLimitTokens?: string;
  note?: string;
}

export interface TokenDescriptor {
  address: Address;
  name: string;
  symbol: string;
  decimals: number | null;
  standard: "ERC20" | "ERC7984";
}

export interface RegistryPair {
  id: string;
  chainId: number;
  network: "sepolia";
  registryAddress: Address;
  source: RegistryPairSource;
  sourceUrl: string;
  official: boolean;
  valid: boolean;
  mock: boolean;
  assetKey: string;
  underlying: TokenDescriptor & {
    mint: MintPolicy;
  };
  confidential: TokenDescriptor & {
    wrapper: true;
  };
  capabilities: {
    faucet: boolean;
    wrap: boolean;
    unwrap: boolean;
    decrypt: boolean;
    transfer: boolean;
  };
  notes: string[];
}

export interface RegistryCoverage {
  totalPairs: number;
  officialPairs: number;
  localPairs: number;
  validPairs: number;
  publicMintPairs: number;
  restrictedMintPairs: number;
  decryptablePairs: number;
}

export interface RegistrySourceHealth {
  source: RegistryPairSource | "static-fallback";
  status: "loaded" | "skipped" | "failed";
  detail: string;
  updatedAt: string;
}

export interface RegistrySnapshot {
  chain: {
    id: "sepolia";
    name: string;
    chainId: number;
    gatewayChainId: number;
    registryAddress: Address;
    explorerUrl: string;
  };
  pairs: RegistryPair[];
  coverage: RegistryCoverage;
  sourceHealth: RegistrySourceHealth[];
  warnings: string[];
}
