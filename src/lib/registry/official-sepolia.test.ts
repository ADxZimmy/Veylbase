import { describe, expect, it } from "vitest";
import { isAddress } from "viem";
import { SEPOLIA_CHAIN } from "@/lib/chains";
import { OFFICIAL_SEPOLIA_PAIRS } from "@/lib/registry/official-sepolia";

describe("official Sepolia registry snapshot", () => {
  it("contains the current official Zama Sepolia wrapper coverage", () => {
    expect(OFFICIAL_SEPOLIA_PAIRS).toHaveLength(8);
    expect(
      OFFICIAL_SEPOLIA_PAIRS.filter(
        (pair) => pair.underlying.mint.mode === "public"
      )
    ).toHaveLength(7);
    expect(
      OFFICIAL_SEPOLIA_PAIRS.every(
        (pair) => pair.registryAddress === SEPOLIA_CHAIN.registryAddress
      )
    ).toBe(true);
  });

  it("uses valid EVM addresses without duplicate pairs", () => {
    const underlying = new Set<string>();
    const confidential = new Set<string>();

    for (const pair of OFFICIAL_SEPOLIA_PAIRS) {
      expect(isAddress(pair.underlying.address)).toBe(true);
      expect(isAddress(pair.confidential.address)).toBe(true);
      expect(underlying.has(pair.underlying.address.toLowerCase())).toBe(false);
      expect(confidential.has(pair.confidential.address.toLowerCase())).toBe(false);
      underlying.add(pair.underlying.address.toLowerCase());
      confidential.add(pair.confidential.address.toLowerCase());
    }
  });
});
