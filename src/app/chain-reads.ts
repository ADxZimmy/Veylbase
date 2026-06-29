import {
  createPublicClient,
  formatUnits,
  http,
  type Address,
  type PublicClient
} from "viem";
import { sepolia } from "viem/chains";
import { SEPOLIA_CHAIN, resolveSepoliaRpcUrl } from "@/lib/chains";

/** Sepolia chain id as the 0x-hex form used by EIP-1193 wallet requests. */
export const SEPOLIA_HEX_CHAIN_ID = `0x${SEPOLIA_CHAIN.chainId.toString(16)}`;

const erc20Abi = [
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "owner", type: "address" }],
    outputs: [{ name: "", type: "uint256" }]
  },
  {
    type: "function",
    name: "decimals",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }]
  }
] as const;

let cachedClient: PublicClient | undefined;

function publicClient(): PublicClient {
  if (!cachedClient) {
    cachedClient = createPublicClient({
      chain: sepolia,
      transport: http(resolveSepoliaRpcUrl())
    });
  }
  return cachedClient;
}

export interface TokenBalance {
  /** Raw base-unit balance. */
  raw: bigint;
  decimals: number;
  /** Human-readable balance, e.g. "12.5". */
  formatted: string;
}

/**
 * Read a public ERC-20 balance for `owner`. Falls back to an on-chain
 * `decimals()` read when the registry snapshot has not populated decimals.
 */
export async function readPublicBalance(
  token: Address,
  owner: Address,
  knownDecimals: number | null
): Promise<TokenBalance> {
  const client = publicClient();
  const decimals =
    knownDecimals ??
    Number(
      await client.readContract({
        abi: erc20Abi,
        address: token,
        functionName: "decimals"
      })
    );

  const raw = await client.readContract({
    abi: erc20Abi,
    address: token,
    functionName: "balanceOf",
    args: [owner]
  });

  return { raw, decimals, formatted: formatUnits(raw, decimals) };
}
