import { describe, expect, it } from "vitest";
import { buildTransactionPlan } from "@/server/transactions/planner";

const account = "0x1111111111111111111111111111111111111111";

describe("transaction planner", () => {
  it("plans a wrap as approve then wrapper call", async () => {
    const plan = await buildTransactionPlan({
      intent: "wrap",
      pairId: "usdc-mock-sepolia",
      account,
      amountBaseUnits: "1000000"
    });

    expect(plan.intent).toBe("wrap");
    expect(plan.pair?.confidential.symbol).toBe("cUSDCMock");
    expect(plan.steps.map((step) => step.id)).toContain("approve-wrapper");
    expect(plan.steps.map((step) => step.id)).toContain("wrap");
    expect(plan.steps.find((step) => step.id === "wrap")?.sdkAction?.method).toBe(
      "shield"
    );
  });

  it("plans arbitrary ERC-7984 balance decryption without requiring registry membership", async () => {
    const token = "0x2222222222222222222222222222222222222222";
    const plan = await buildTransactionPlan({
      intent: "decryptBalance",
      account,
      confidentialTokenAddress: token
    });

    expect(plan.intent).toBe("decryptBalance");
    expect(plan.arbitraryConfidentialTokenAddress).toBe(token);
    expect(plan.steps.map((step) => step.id)).toEqual([
      "wallet-on-sepolia",
      "read-encrypted-balance",
      "sign-user-decryption-permit",
      "decrypt-balance"
    ]);
  });
});
