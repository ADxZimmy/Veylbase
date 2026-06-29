import { getAddress, isAddress, isHex } from "viem";
import { z } from "zod";

const addressSchema = z
  .string()
  .trim()
  .refine((value) => isAddress(value, { strict: false }), "Expected an EVM address")
  .transform((value) => getAddress(value));

const amountSchema = z
  .string()
  .trim()
  .regex(/^[0-9]+$/, "Amount must be a base-unit integer string")
  .refine((value) => BigInt(value) > 0n, "Amount must be greater than zero");

const hexSchema = z
  .string()
  .trim()
  .refine((value) => isHex(value, { strict: true }), "Expected a 0x-prefixed hex value");

export const transactionPlanRequestSchema = z.discriminatedUnion("intent", [
  z.object({
    intent: z.literal("claimFaucet"),
    pairId: z.string().min(1),
    account: addressSchema,
    amountBaseUnits: amountSchema
  }),
  z.object({
    intent: z.literal("wrap"),
    pairId: z.string().min(1),
    account: addressSchema,
    recipient: addressSchema.optional(),
    amountBaseUnits: amountSchema
  }),
  z.object({
    intent: z.literal("unwrap"),
    pairId: z.string().min(1),
    account: addressSchema,
    recipient: addressSchema.optional(),
    amountBaseUnits: amountSchema
  }),
  z.object({
    intent: z.literal("finalizeUnwrap"),
    pairId: z.string().min(1),
    account: addressSchema,
    unwrapRequestId: hexSchema,
    cleartextAmount: amountSchema,
    decryptionProof: hexSchema
  }),
  z.object({
    intent: z.literal("decryptBalance"),
    account: addressSchema,
    pairId: z.string().min(1).optional(),
    confidentialTokenAddress: addressSchema.optional()
  })
]);

export type TransactionPlanRequest = z.infer<typeof transactionPlanRequestSchema>;
