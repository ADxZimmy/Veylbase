export type ActionPlanKey =
  | "claimFaucet"
  | "wrap"
  | "unwrap"
  | "decryptBalance";

/**
 * Flattened, presentation-ready view of a {@link RegistryPair}. Every value is
 * derived from the real registry snapshot in `app/page.tsx` — there is no
 * hand-authored fixture data behind this type. Balances are intentionally
 * absent: they are read from chain once a wallet is connected.
 */
export interface UiRegistryPair {
  id: string;
  /** Underlying asset symbol, e.g. "USDC". */
  symbol: string;
  /** Confidential wrapper symbol, e.g. "cUSDC". */
  confidentialSymbol: string;
  /** Human label for the underlying token, e.g. "USDC Mock". */
  name: string;
  /** Underlying ERC-20 decimals, or null until live registry metadata is loaded. */
  decimals: number | null;
  /**
   * Confidential (ERC-7984) token decimals, or null until live metadata loads.
   * Often differs from {@link decimals} — e.g. WETH is 18 underlying / 6
   * confidential. Use this for every confidential-side amount (reveal display,
   * private-balance validation, unwrap input), never the underlying decimals.
   */
  confidentialDecimals: number | null;
  underlyingAddress: string;
  confidentialAddress: string;
  /** True when the underlying exposes the public mock faucet mint. */
  faucet: boolean;
  /** True for Zama mock tokens (vs. an official production wrapper). */
  mock: boolean;
  /** True when the registry flags the asset as test-only / not the real token. */
  testOnly: boolean;
}

export interface UiRegistryChain {
  name: string;
  chainId: number;
  registryAddress: string;
  explorerUrl: string;
}

export interface UiRegistrySnapshot {
  chain: UiRegistryChain;
  pairs: UiRegistryPair[];
}
