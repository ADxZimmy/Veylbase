import type { RegistryPair } from "@/lib/registry/types";
import type { UiRegistryPair } from "./app-types";

/** Trim the "Mock" suffix used in the snapshot symbols (USDCMock -> USDC). */
export function cleanSymbol(value: string) {
  return value.replace(/Mock$/u, "");
}

/** Derive the test-only flag from the registry's own notes (no hardcoding). */
export function isTestOnly(pair: RegistryPair) {
  return pair.notes.some((note) => /only for testing|not the real/iu.test(note));
}

/** Flatten a registry pair into the presentation-ready shape the UI consumes. */
export function toUiPair(pair: RegistryPair): UiRegistryPair {
  return {
    id: pair.id,
    symbol: cleanSymbol(pair.underlying.symbol),
    confidentialSymbol: cleanSymbol(pair.confidential.symbol),
    name: pair.underlying.name,
    decimals: pair.underlying.decimals,
    confidentialDecimals: pair.confidential.decimals,
    underlyingAddress: pair.underlying.address,
    confidentialAddress: pair.confidential.address,
    faucet: pair.capabilities.faucet,
    mock: pair.mock,
    testOnly: isTestOnly(pair)
  };
}
