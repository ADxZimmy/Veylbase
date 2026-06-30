import { describe, expect, it } from "vitest";
import { OFFICIAL_SEPOLIA_PAIRS } from "@/lib/registry/official-sepolia";
import { cleanSymbol, isTestOnly, toUiPair } from "./registry-view";

function pair(id: string) {
  const found = OFFICIAL_SEPOLIA_PAIRS.find((candidate) => candidate.id === id);
  if (!found) throw new Error(`Fixture pair missing: ${id}`);
  return found;
}

describe("registry-view mapping", () => {
  it("strips the Mock suffix from symbols", () => {
    expect(cleanSymbol("USDCMock")).toBe("USDC");
    expect(cleanSymbol("cUSDCMock")).toBe("cUSDC");
    expect(cleanSymbol("tGBP")).toBe("tGBP");
  });

  it("maps a public mock pair to clean UI fields", () => {
    const ui = toUiPair(pair("usdc-mock-sepolia"));
    expect(ui).toMatchObject({
      symbol: "USDC",
      confidentialSymbol: "cUSDC",
      faucet: true,
      mock: true,
      testOnly: false
    });
    expect(ui.underlyingAddress).toMatch(/^0x[0-9a-fA-F]{40}$/u);
  });

  it("derives testOnly from the registry note rather than hardcoding", () => {
    expect(isTestOnly(pair("zama-mock-sepolia"))).toBe(true);
    expect(toUiPair(pair("zama-mock-sepolia")).testOnly).toBe(true);
    expect(toUiPair(pair("usdc-mock-sepolia")).testOnly).toBe(false);
  });

  it("flags the official (non-mock, restricted) pair correctly", () => {
    const ui = toUiPair(pair("tgbp-official-sepolia"));
    expect(ui.mock).toBe(false);
    expect(ui.faucet).toBe(false);
    expect(ui.testOnly).toBe(false);
  });

  it("preserves null decimals from the static snapshot", () => {
    // The checked-in snapshot leaves decimals null; they are filled from chain.
    const ui = toUiPair(pair("usdc-mock-sepolia"));
    expect(ui.decimals).toBeNull();
    expect(ui.confidentialDecimals).toBeNull();
  });

  it("carries underlying and confidential decimals separately", () => {
    // Live WETH is 18 underlying / 6 confidential — they must not be conflated,
    // or reveal/unshield amounts are off by ~10^12. Simulate populated metadata.
    const weth = pair("weth-mock-sepolia");
    const populated = {
      ...weth,
      underlying: { ...weth.underlying, decimals: 18 },
      confidential: { ...weth.confidential, decimals: 6 }
    };
    const ui = toUiPair(populated);
    expect(ui.decimals).toBe(18);
    expect(ui.confidentialDecimals).toBe(6);
  });
});
