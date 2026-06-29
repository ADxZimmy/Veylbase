import type { Address } from "viem";
import {
  ZAMA_CONFIDENTIAL_WRAPPER_DOC_URL,
  ZAMA_WRAPPER_REGISTRY_DOC_URL,
  SEPOLIA_CHAIN
} from "@/lib/chains";
import type { RegistryPair } from "@/lib/registry/types";
import type {
  TransactionPlan,
  TransactionPlanInput,
  TransactionPlanStep
} from "@/lib/transactions/types";
import { getRegistrySnapshot } from "@/server/registry/service";

function walletStep(account: Address): TransactionPlanStep {
  return {
    id: "wallet-on-sepolia",
    kind: "wallet-check",
    title: "Connected wallet on Sepolia",
    description: `Use ${account} on Sepolia (${SEPOLIA_CHAIN.chainId}) before submitting transactions.`,
    blocking: true
  };
}

function pairSummary(pair: RegistryPair): TransactionPlan["pair"] {
  return {
    id: pair.id,
    assetKey: pair.assetKey,
    valid: pair.valid,
    underlying: pair.underlying,
    confidential: pair.confidential,
    capabilities: pair.capabilities
  };
}

async function requirePair(pairId: string): Promise<RegistryPair> {
  const snapshot = await getRegistrySnapshot({ live: false });
  const pair = snapshot.pairs.find((candidate) => candidate.id === pairId);

  if (!pair) {
    throw new Error(`Unknown registry pair: ${pairId}`);
  }

  return pair;
}

function basePlan(
  input: TransactionPlanInput,
  pair: RegistryPair | undefined,
  steps: TransactionPlanStep[],
  warnings: string[] = []
): TransactionPlan {
  return {
    id: `${input.intent}-${Date.now()}`,
    intent: input.intent,
    chainId: SEPOLIA_CHAIN.chainId,
    registryAddress: SEPOLIA_CHAIN.registryAddress,
    account: "account" in input ? input.account : undefined,
    pair: pair ? pairSummary(pair) : undefined,
    amountBaseUnits: "amountBaseUnits" in input ? input.amountBaseUnits : undefined,
    steps,
    warnings,
    references: [ZAMA_WRAPPER_REGISTRY_DOC_URL, ZAMA_CONFIDENTIAL_WRAPPER_DOC_URL]
  };
}

async function planFaucet(input: Extract<TransactionPlanInput, { intent: "claimFaucet" }>) {
  const pair = await requirePair(input.pairId);
  const warnings: string[] = [];

  if (pair.underlying.mint.mode !== "public") {
    warnings.push(`${pair.assetKey} does not expose the public mock faucet mint flow.`);
  }

  return basePlan(input, pair, [
    walletStep(input.account),
    {
      id: "mint-underlying",
      kind: "contract-write",
      title: `Mint ${pair.underlying.symbol}`,
      description:
        "Call the mock ERC-20 mint function so the wallet can immediately test the wrap flow.",
      blocking: true,
      contractCall: {
        target: pair.underlying.address,
        functionName: "mint",
        signature: "mint(address to,uint256 amount)",
        args: {
          to: input.account,
          amount: input.amountBaseUnits
        }
      }
    }
  ], warnings);
}

async function planWrap(input: Extract<TransactionPlanInput, { intent: "wrap" }>) {
  const pair = await requirePair(input.pairId);
  const recipient = input.recipient ?? input.account;
  const warnings = pair.valid ? [] : [`${pair.id} is revoked or invalid in the registry.`];

  return basePlan(input, pair, [
    walletStep(input.account),
    {
      id: "check-underlying-balance",
      kind: "chain-read",
      title: `Check ${pair.underlying.symbol} balance`,
      description:
        "Read the public ERC-20 balance before asking the user to approve or wrap.",
      blocking: true,
      contractCall: {
        target: pair.underlying.address,
        functionName: "balanceOf",
        signature: "balanceOf(address owner) view returns (uint256)",
        args: { owner: input.account },
        sdkHelper: "balanceOfContract"
      }
    },
    {
      id: "approve-wrapper",
      kind: "contract-write",
      title: `Approve ${pair.confidential.symbol}`,
      description:
        "Approve the confidential wrapper to spend the exact base-unit amount of the underlying ERC-20.",
      blocking: true,
      contractCall: {
        target: pair.underlying.address,
        functionName: "approve",
        signature: "approve(address spender,uint256 amount)",
        args: {
          spender: pair.confidential.address,
          amount: input.amountBaseUnits
        },
        sdkHelper: "approveContract"
      }
    },
    {
      id: "wrap",
      kind: "contract-write",
      title: `Wrap into ${pair.confidential.symbol}`,
      description:
        "Call the wrapper after approval. The wrapper mints confidential ERC-7984 balance to the recipient.",
      blocking: true,
      contractCall: {
        target: pair.confidential.address,
        functionName: "wrap",
        signature: "wrap(address to,uint256 amount) returns (euint64)",
        args: {
          to: recipient,
          amount: input.amountBaseUnits
        },
        sdkHelper: "wrapContract"
      },
      sdkAction: {
        package: "@zama-fhe/sdk",
        className: "WrappedToken",
        method: "shield",
        args: {
          amount: input.amountBaseUnits,
          to: recipient
        }
      }
    }
  ], warnings);
}

async function planUnwrap(input: Extract<TransactionPlanInput, { intent: "unwrap" }>) {
  const pair = await requirePair(input.pairId);
  const recipient = input.recipient ?? input.account;
  const warnings = pair.valid ? [] : [`${pair.id} is revoked or invalid in the registry.`];

  return basePlan(input, pair, [
    walletStep(input.account),
    {
      id: "decrypt-or-check-confidential-balance",
      kind: "sdk-action",
      title: `Check ${pair.confidential.symbol} balance`,
      description:
        "Use the SDK balance helper when possible so the UI can catch insufficient confidential balance before unwrapping.",
      blocking: false,
      sdkAction: {
        package: "@zama-fhe/sdk",
        className: "Token",
        method: "balanceOf",
        args: {
          owner: input.account,
          token: pair.confidential.address
        }
      }
    },
    {
      id: "encrypt-unwrap-amount",
      kind: "sdk-action",
      title: "Encrypt unwrap amount",
      description:
        "Create an external euint64 input and proof for the plaintext amount before calling unwrap.",
      blocking: true,
      sdkAction: {
        package: "@zama-fhe/sdk",
        className: "ZamaSDK",
        method: "encrypt",
        args: {
          amount: input.amountBaseUnits,
          contractAddress: pair.confidential.address
        }
      }
    },
    {
      id: "request-unwrap",
      kind: "contract-write",
      title: `Request ${pair.confidential.symbol} unwrap`,
      description:
        "Submit the encrypted unwrap request. The transaction emits UnwrapRequested with an unwrapRequestId.",
      blocking: true,
      contractCall: {
        target: pair.confidential.address,
        functionName: "unwrap",
        signature:
          "unwrap(address from,address to,bytes32 encryptedAmount,bytes inputProof) returns (bytes32)",
        args: {
          from: input.account,
          to: recipient,
          encryptedAmount: "<from SDK encrypt>",
          inputProof: "<from SDK encrypt>"
        },
        sdkHelper: "unwrapContract"
      }
    },
    {
      id: "wait-for-unwrap-request",
      kind: "wait",
      title: "Wait for UnwrapRequested",
      description:
        "Read the transaction receipt and extract unwrapRequestId from the emitted event.",
      blocking: true
    },
    {
      id: "finalize-unwrap",
      kind: "sdk-action",
      title: "Finalize unwrap",
      description:
        "Use WrappedToken.unshield for the full orchestrated flow or call finalizeUnwrap after public decryption.",
      blocking: true,
      sdkAction: {
        package: "@zama-fhe/sdk",
        className: "WrappedToken",
        method: "unshield",
        args: {
          amount: input.amountBaseUnits,
          to: recipient
        }
      }
    }
  ], warnings);
}

async function planFinalizeUnwrap(
  input: Extract<TransactionPlanInput, { intent: "finalizeUnwrap" }>
) {
  const pair = await requirePair(input.pairId);

  return basePlan(input, pair, [
    walletStep(input.account),
    {
      id: "finalize-unwrap",
      kind: "contract-write",
      title: "Finalize unwrap request",
      description:
        "Submit the clear amount and public decryption proof for a prior UnwrapRequested event.",
      blocking: true,
      contractCall: {
        target: pair.confidential.address,
        functionName: "finalizeUnwrap",
        signature:
          "finalizeUnwrap(bytes32 unwrapRequestId,uint64 unwrapAmountCleartext,bytes decryptionProof)",
        args: {
          unwrapRequestId: input.unwrapRequestId,
          unwrapAmountCleartext: input.cleartextAmount,
          decryptionProof: input.decryptionProof
        },
        sdkHelper: "finalizeUnwrapContract"
      }
    }
  ]);
}

async function planDecryptBalance(
  input: Extract<TransactionPlanInput, { intent: "decryptBalance" }>
) {
  const pair = input.pairId ? await requirePair(input.pairId) : undefined;
  const confidentialTokenAddress =
    pair?.confidential.address ?? input.confidentialTokenAddress;

  if (!confidentialTokenAddress) {
    throw new Error("Provide pairId or confidentialTokenAddress for decryptBalance.");
  }

  return {
    ...basePlan(input, pair, [
      walletStep(input.account),
      {
        id: "read-encrypted-balance",
        kind: "chain-read",
        title: "Read encrypted balance handle",
        description:
          "Read confidentialBalanceOf before user decryption so the UI can explain what will be decrypted.",
        blocking: true,
        contractCall: {
          target: confidentialTokenAddress,
          functionName: "confidentialBalanceOf",
          signature: "confidentialBalanceOf(address owner) view returns (euint64)",
          args: { owner: input.account },
          sdkHelper: "confidentialBalanceOfContract"
        }
      },
      {
        id: "sign-user-decryption-permit",
        kind: "wallet-signature",
        title: "Sign EIP-712 decryption permit",
        description:
          "The user authorizes decryption for this token address without sending a transaction.",
        blocking: true,
        sdkAction: {
          package: "@zama-fhe/sdk",
          className: "ZamaSDK",
          method: "permits.grantPermit",
          args: { contractAddress: confidentialTokenAddress }
        }
      },
      {
        id: "decrypt-balance",
        kind: "sdk-action",
        title: "Decrypt balance",
        description:
          "Use Token.balanceOf(owner), which handles user decryption and returns the plaintext balance.",
        blocking: true,
        sdkAction: {
          package: "@zama-fhe/sdk",
          className: "Token",
          method: "balanceOf",
          args: {
            owner: input.account,
            token: confidentialTokenAddress
          }
        }
      }
    ]),
    arbitraryConfidentialTokenAddress: pair ? undefined : confidentialTokenAddress
  };
}

export async function buildTransactionPlan(input: TransactionPlanInput) {
  switch (input.intent) {
    case "claimFaucet":
      return planFaucet(input);
    case "wrap":
      return planWrap(input);
    case "unwrap":
      return planUnwrap(input);
    case "finalizeUnwrap":
      return planFinalizeUnwrap(input);
    case "decryptBalance":
      return planDecryptBalance(input);
    default:
      input satisfies never;
      throw new Error("Unsupported transaction intent.");
  }
}
