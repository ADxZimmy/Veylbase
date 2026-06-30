"use client";

import {
  ZamaSDK,
  indexedDBStorage,
  type ShieldCallbacks,
  type TransactionResult,
  type UnshieldCallbacks
} from "@zama-fhe/sdk";
import { sepolia as fheSepolia, type FheChain } from "@zama-fhe/sdk/chains";
import { createConfig } from "@zama-fhe/sdk/viem";
import { web } from "@zama-fhe/sdk/web";
import {
  createPublicClient,
  createWalletClient,
  custom,
  getAddress,
  http,
  type Address,
  type EIP1193Provider,
  type Hex,
  type PublicClient,
  type WalletClient
} from "viem";
import { sepolia } from "viem/chains";
import { resolveSepoliaRpcUrl } from "@/lib/chains";

export type ExecutionPhase =
  | "planning"
  | "signing"
  | "submitted"
  | "waiting"
  | "finalizing"
  | "complete";

export interface ExecutionProgress {
  phase: ExecutionPhase;
  title: string;
  detail?: string;
  txHash?: Hex;
}

export interface ExecutionCallbacks {
  onProgress?: (progress: ExecutionProgress) => void;
}

export interface WriteExecutionResult {
  kind: "transaction";
  title: string;
  txHash: Hex;
  result: TransactionResult;
}

export interface RevealExecutionResult {
  kind: "reveal";
  title: string;
  value: bigint;
}

export type ConfidentialExecutionResult =
  | WriteExecutionResult
  | RevealExecutionResult;

export interface BrowserEthereumProvider {
  request(args: { method: string; params?: unknown }): Promise<unknown>;
  on?(event: string, listener: (...args: unknown[]) => void): void;
  removeListener?(event: string, listener: (...args: unknown[]) => void): void;
}

const faucetAbi = [
  {
    type: "function",
    name: "mint",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" }
    ],
    outputs: []
  }
] as const;

let cachedPublicClient: PublicClient | undefined;

function getPublicClient() {
  cachedPublicClient ??= createPublicClient({
    chain: sepolia,
    transport: http(resolveSepoliaRpcUrl())
  });
  return cachedPublicClient;
}

function createWallet(provider: BrowserEthereumProvider, account: Address) {
  return createWalletClient({
    account,
    chain: sepolia,
    transport: custom(provider as EIP1193Provider)
  });
}

function createSdk(provider: BrowserEthereumProvider, account: Address) {
  const rpcUrl = resolveSepoliaRpcUrl();
  const chain = {
    ...fheSepolia,
    network: rpcUrl
  } as const satisfies FheChain;

  const publicClient = getPublicClient();
  const walletClient = createWallet(provider, account);
  const config = createConfig({
    chains: [chain],
    publicClient: publicClient as PublicClient,
    walletClient: walletClient as WalletClient,
    ethereum: provider as EIP1193Provider,
    relayers: { [chain.id]: web() },
    storage: indexedDBStorage
  });

  return new ZamaSDK(config);
}

export async function executeFaucetMint({
  account,
  amount,
  provider,
  tokenAddress,
  callbacks
}: {
  account: Address;
  amount: bigint;
  provider: BrowserEthereumProvider;
  tokenAddress: Address;
  callbacks?: ExecutionCallbacks;
}): Promise<WriteExecutionResult> {
  callbacks?.onProgress?.({
    phase: "signing",
    title: "Confirm mint in wallet",
    detail: "The mock token faucet mints public test tokens to your wallet."
  });

  const wallet = createWallet(provider, account);
  const txHash = await wallet.writeContract({
    address: tokenAddress,
    abi: faucetAbi,
    functionName: "mint",
    args: [account, amount]
  });

  callbacks?.onProgress?.({
    phase: "submitted",
    title: "Mint submitted",
    detail: "Waiting for Sepolia confirmation.",
    txHash
  });

  const receipt = await getPublicClient().waitForTransactionReceipt({ hash: txHash });

  callbacks?.onProgress?.({
    phase: "complete",
    title: "Test tokens received",
    detail: "Your public balance can now be shielded.",
    txHash
  });

  return {
    kind: "transaction",
    title: "Test tokens received",
    txHash,
    result: { txHash, receipt }
  };
}

export async function executeShield({
  account,
  amount,
  callbacks,
  provider,
  wrapperAddress
}: {
  account: Address;
  amount: bigint;
  callbacks?: ExecutionCallbacks;
  provider: BrowserEthereumProvider;
  wrapperAddress: Address;
}): Promise<WriteExecutionResult> {
  const sdk = createSdk(provider, account);
  try {
    const wrapper = sdk.createWrappedToken(wrapperAddress);
    const shieldCallbacks: ShieldCallbacks = {
      onApprovalSubmitted: (txHash) =>
        callbacks?.onProgress?.({
          phase: "submitted",
          title: "Approval submitted",
          detail: "The wrapper can spend the exact public token amount.",
          txHash
        }),
      onShieldSubmitted: (txHash) =>
        callbacks?.onProgress?.({
          phase: "submitted",
          title: "Shield submitted",
          detail: "Waiting for confidential wrapper confirmation.",
          txHash
        })
    };

    callbacks?.onProgress?.({
      phase: "signing",
      title: "Confirm shield flow",
      detail: "Your wallet may request approval and then the shield transaction."
    });

    const result = await wrapper.shield(amount, {
      approvalStrategy: "exact",
      to: account,
      ...shieldCallbacks
    });

    callbacks?.onProgress?.({
      phase: "complete",
      title: "Balance shielded",
      detail: "Your confidential balance changed. Reveal it to view the new value.",
      txHash: result.txHash
    });

    return {
      kind: "transaction",
      title: "Balance shielded",
      txHash: result.txHash,
      result
    };
  } finally {
    sdk.terminate();
  }
}

export async function executeUnshield({
  account,
  amount,
  callbacks,
  provider,
  wrapperAddress
}: {
  account: Address;
  amount: bigint;
  callbacks?: ExecutionCallbacks;
  provider: BrowserEthereumProvider;
  wrapperAddress: Address;
}): Promise<WriteExecutionResult> {
  const sdk = createSdk(provider, account);
  try {
    const wrapper = sdk.createWrappedToken(wrapperAddress);
    const unshieldCallbacks: UnshieldCallbacks = {
      onUnwrapSubmitted: (txHash) =>
        callbacks?.onProgress?.({
          phase: "submitted",
          title: "Unshield request submitted",
          detail: "The encrypted unwrap request is waiting for confirmation.",
          txHash
        }),
      onFinalizing: () =>
        callbacks?.onProgress?.({
          phase: "finalizing",
          title: "Finalizing unshield",
          detail: "The SDK found the unwrap request and is preparing the finalize transaction."
        }),
      onFinalizeSubmitted: (txHash) =>
        callbacks?.onProgress?.({
          phase: "submitted",
          title: "Finalize submitted",
          detail: "Waiting for the public tokens to be released.",
          txHash
        })
    };

    callbacks?.onProgress?.({
      phase: "signing",
      title: "Confirm unshield flow",
      detail: "The SDK encrypts the amount, submits unwrap, then finalizes release."
    });

    // Let the SDK validate the confidential balance (it decrypts via permit)
    // so an over-unshield fails pre-flight instead of reverting on-chain.
    const result = await wrapper.unshield(amount, {
      ...unshieldCallbacks
    });

    callbacks?.onProgress?.({
      phase: "complete",
      title: "Balance unshielded",
      detail: "Public tokens were released after the finalize transaction.",
      txHash: result.txHash
    });

    return {
      kind: "transaction",
      title: "Balance unshielded",
      txHash: result.txHash,
      result
    };
  } finally {
    sdk.terminate();
  }
}

export async function revealConfidentialBalance({
  account,
  callbacks,
  provider,
  tokenAddress
}: {
  account: Address;
  callbacks?: ExecutionCallbacks;
  provider: BrowserEthereumProvider;
  tokenAddress: Address;
}): Promise<RevealExecutionResult> {
  const sdk = createSdk(provider, account);
  try {
    callbacks?.onProgress?.({
      phase: "signing",
      title: "Authorize decryption",
      detail: "You sign a permit. This does not submit an on-chain transaction."
    });

    const token = sdk.createToken(getAddress(tokenAddress));
    const value = await token.balanceOf(account);

    callbacks?.onProgress?.({
      phase: "complete",
      title: "Private balance revealed",
      detail: "The plaintext value is shown only in this session."
    });

    return {
      kind: "reveal",
      title: "Private balance revealed",
      value
    };
  } finally {
    sdk.terminate();
  }
}
