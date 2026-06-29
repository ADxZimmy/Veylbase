import type { Address, Hex } from "viem";
import type { RegistryPair } from "@/lib/registry/types";

export type TransactionIntent =
  | "claimFaucet"
  | "wrap"
  | "unwrap"
  | "finalizeUnwrap"
  | "decryptBalance";

export type TransactionStepKind =
  | "wallet-check"
  | "chain-read"
  | "contract-write"
  | "sdk-action"
  | "wallet-signature"
  | "wait";

export interface PlannedContractCall {
  target: Address;
  functionName: string;
  signature: string;
  args: Record<string, string>;
  sdkHelper?: string;
}

export interface PlannedSdkAction {
  package: "@zama-fhe/sdk";
  className: "Token" | "WrappedToken" | "WrappersRegistry" | "ZamaSDK";
  method: string;
  args: Record<string, string>;
}

export interface TransactionPlanStep {
  id: string;
  kind: TransactionStepKind;
  title: string;
  description: string;
  blocking: boolean;
  contractCall?: PlannedContractCall;
  sdkAction?: PlannedSdkAction;
}

export interface TransactionPlan {
  id: string;
  intent: TransactionIntent;
  chainId: number;
  registryAddress: Address;
  account?: Address;
  pair?: Pick<
    RegistryPair,
    "id" | "assetKey" | "valid" | "underlying" | "confidential" | "capabilities"
  >;
  arbitraryConfidentialTokenAddress?: Address;
  amountBaseUnits?: string;
  steps: TransactionPlanStep[];
  warnings: string[];
  references: string[];
}

export interface ClaimFaucetPlanInput {
  intent: "claimFaucet";
  pairId: string;
  account: Address;
  amountBaseUnits: string;
}

export interface WrapPlanInput {
  intent: "wrap";
  pairId: string;
  account: Address;
  amountBaseUnits: string;
  recipient?: Address;
}

export interface UnwrapPlanInput {
  intent: "unwrap";
  pairId: string;
  account: Address;
  amountBaseUnits: string;
  recipient?: Address;
}

export interface FinalizeUnwrapPlanInput {
  intent: "finalizeUnwrap";
  pairId: string;
  account: Address;
  unwrapRequestId: Hex;
  cleartextAmount: string;
  decryptionProof: Hex;
}

export interface DecryptBalancePlanInput {
  intent: "decryptBalance";
  account: Address;
  pairId?: string;
  confidentialTokenAddress?: Address;
}

export type TransactionPlanInput =
  | ClaimFaucetPlanInput
  | WrapPlanInput
  | UnwrapPlanInput
  | FinalizeUnwrapPlanInput
  | DecryptBalancePlanInput;
