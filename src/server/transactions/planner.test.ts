import { describe, expect, it } from "vitest";
import { buildTransactionPlan } from "@/server/transactions/planner";

const account = "0x1111111111111111111111111111111111111111";

describe("transaction planner", () => {
  it("plans a wrap as a single explicit approve then wrapper call", async () => {
    const plan = await buildTransactionPlan({
      intent: "wrap",
      pairId: "usdc-mock-sepolia",
      account,
      amountBaseUnits: "1000000"
    });

    expect(plan.intent).toBe("wrap");
    expect(plan.pair?.confidential.symbol).toBe("cUSDCMock");
    expect(plan.steps.map((step) => step.id)).toContain("approve-wrapper");

    const wrapStep = plan.steps.find((step) => step.id === "wrap");
    // Each step models exactly one execution mechanism: the wrap step is the
    // explicit on-chain call, not also a higher-level shield orchestration.
    expect(wrapStep?.contractCall?.functionName).toBe("wrap");
    expect(wrapStep?.contractCall?.sdkHelper).toBe("wrapContract");
    expect(wrapStep?.sdkAction).toBeUndefined();
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
