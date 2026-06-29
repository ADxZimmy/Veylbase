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
  gatewayChainId: 55815,
  nativeCurrency: "ETH",
  explorerUrl: "https://sepolia.etherscan.io",
  defaultRpcUrl: "https://ethereum-sepolia-rpc.publicnode.com",
  rpcEnvKey: "NEXT_PUBLIC_SEPOLIA_RPC_URL",
  relayerUrl: "https://relayer.testnet.zama.cloud",
  registryAddress: "0x2f0750Bbb0A246059d80e94c454586a7F27a128e" as Address
} as const;

export function resolveSepoliaRpcUrl() {
  return process.env[SEPOLIA_CHAIN.rpcEnvKey] ?? SEPOLIA_CHAIN.defaultRpcUrl;
}

export function etherscanAddressUrl(address: Address) {
  return `${SEPOLIA_CHAIN.explorerUrl}/address/${address}`;
}
