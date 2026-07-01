import type { Address } from "viem";

export const ZAMA_PROTOCOL_APPS_SEPOLIA_URL =
  "https://raw.githubusercontent.com/zama-ai/protocol-apps/main/docs/addresses/testnet/sepolia.md";

export const ZAMA_WRAPPER_REGISTRY_DOC_URL =
  "https://github.com/zama-ai/protocol-apps/blob/main/docs/wrapper-registry.md";

export const ZAMA_CONFIDENTIAL_WRAPPER_DOC_URL =
  "https://github.com/zama-ai/protocol-apps/blob/main/docs/confidential-wrapper.md";

export const SEPOLIA_CHAIN = {
  id: "sepolia",
  name: "Sepolia",
  chainId: 11155111,
  // Display-only until Phase 006 UAT resolves the SDK preset drift. The
  // @zama-fhe/sdk Sepolia preset used by createSdk is authoritative and was
  // observed in 3.2.0 docs/dist as gateway 10901 with relayer
  // https://relayer.testnet.zama.org/v2. Confirm live Network-tab traffic
  // before changing the values surfaced from this registry metadata object.
  gatewayChainId: 55815,
  nativeCurrency: "ETH",
  explorerUrl: "https://sepolia.etherscan.io",
  defaultRpcUrl: "https://ethereum-sepolia-rpc.publicnode.com",
  rpcEnvKey: "NEXT_PUBLIC_SEPOLIA_RPC_URL",
  // Display-only; confidential execution uses the SDK Sepolia preset.
  relayerUrl: "https://relayer.testnet.zama.cloud",
  registryAddress: "0x2f0750Bbb0A246059d80e94c454586a7F27a128e" as Address
} as const;

export function resolveSepoliaRpcUrl() {
  return process.env[SEPOLIA_CHAIN.rpcEnvKey] ?? SEPOLIA_CHAIN.defaultRpcUrl;
}

export function etherscanAddressUrl(address: Address) {
  return `${SEPOLIA_CHAIN.explorerUrl}/address/${address}`;
}
