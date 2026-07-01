import { describe, expect, it } from "vitest";
import { executionErrorMessage } from "./execution-errors";

describe("executionErrorMessage", () => {
  it("maps stable bridge error codes without importing the SDK", () => {
    expect(
      executionErrorMessage({
        code: "zama-runtime-unavailable",
        message: "worker failed"
      })
    ).toBe(
      "Could not load the Zama encryption runtime (cdn.zama.org). Check your connection and retry."
    );
    expect(
      executionErrorMessage({
        code: "zama-relayer-unavailable",
        message: "relayer 503"
      })
    ).toBe("The Zama relayer may be temporarily unavailable - try again.");
  });

  it("keeps wallet rejection copy short", () => {
    expect(executionErrorMessage(new Error("User rejected the request"))).toBe(
      "Wallet request was rejected."
    );
  });
});
