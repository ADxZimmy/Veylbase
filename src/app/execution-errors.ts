/**
 * Normalize an execution/SDK/wallet error into a short user-facing message.
 * Deliberately free of any @zama-fhe/sdk import so it can be statically bundled
 * while the heavy execution module is loaded on demand.
 */
export function executionErrorMessage(error: unknown) {
  const code =
    error && typeof error === "object" && "code" in error
      ? String((error as { code?: unknown }).code)
      : "";

  if (code === "wallet-rejected") return "Wallet request was rejected.";
  if (code === "wrong-network") return "Your wallet and the app are not both on Sepolia.";
  if (code === "confidential-balance-low") {
    return "Your revealed private balance is not high enough for this unshield.";
  }
  if (code === "no-private-balance") {
    return "No private balance exists for this asset yet.";
  }
  if (code === "zama-runtime-unavailable") {
    return "Could not load the Zama encryption runtime (cdn.zama.org). Check your connection and retry.";
  }
  if (code === "zama-relayer-unavailable") {
    return "The Zama relayer may be temporarily unavailable - try again.";
  }
  if (code === "zama-decryption-failed") {
    return "Could not decrypt this private balance. Try again in a moment.";
  }

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
  if (
    normalized.includes("cdn.zama.org") ||
    normalized.includes("importscripts") ||
    normalized.includes("wasm") ||
    normalized.includes("worker")
  ) {
    return "Could not load the Zama encryption runtime (cdn.zama.org). Check your connection and retry.";
  }
  if (normalized.includes("relayer") || normalized.includes("decrypt")) {
    return "The Zama relayer may be temporarily unavailable - try again.";
  }
  return candidate;
}
