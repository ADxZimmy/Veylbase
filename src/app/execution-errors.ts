/**
 * Normalize an execution/SDK/wallet error into a short user-facing message.
 * Deliberately free of any @zama-fhe/sdk import so it can be statically bundled
 * while the heavy execution module is loaded on demand.
 */
export function executionErrorMessage(error: unknown) {
  const candidate =
    error && typeof error === "object" && "shortMessage" in error
      ? String((error as { shortMessage?: unknown }).shortMessage)
      : error instanceof Error
        ? error.message
        : "The action could not be completed.";

  const normalized = candidate.toLowerCase();
  if (
    normalized.includes("user rejected") ||
    normalized.includes("rejected") ||
    normalized.includes("denied") ||
    normalized.includes("4001")
  ) {
    return "Wallet request was rejected.";
  }
  if (normalized.includes("insufficient")) {
    return candidate;
  }
  if (normalized.includes("wrong chain") || normalized.includes("chain mismatch")) {
    return "Your wallet and the app are not both on Sepolia.";
  }
  if (normalized.includes("relayer") || normalized.includes("decrypt")) {
    return candidate;
  }
  return candidate;
}
