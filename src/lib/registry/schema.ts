import { getAddress, isAddress } from "viem";
import { z } from "zod";

const addressSchema = z
  .string()
  .trim()
  .refine((value) => isAddress(value, { strict: false }), "Expected an EVM address")
  .transform((value) => getAddress(value));

const tokenSchema = z.object({
  address: addressSchema,
  name: z.string().min(1),
  symbol: z.string().min(1),
  decimals: z.number().int().min(0).max(255).nullable().default(null)
});

export const localRegistryPairSchema = z.object({
  id: z
    .string()
    .min(3)
    .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers, and dashes"),
  assetKey: z.string().min(1),
  mock: z.boolean().default(false),
  valid: z.boolean().default(true),
  underlying: tokenSchema.extend({
    mint: z
      .object({
        mode: z.enum(["public", "restricted", "none", "unknown"]),
        perCallLimitTokens: z.string().optional(),
        note: z.string().optional()
      })
      .default({ mode: "unknown" })
  }),
  confidential: tokenSchema,
  notes: z.array(z.string()).default([])
});

export const localRegistryConfigSchema = z.object({
  pairs: z.array(localRegistryPairSchema).default([])
});

export type LocalRegistryPairInput = z.infer<typeof localRegistryPairSchema>;
export type LocalRegistryConfigInput = z.infer<typeof localRegistryConfigSchema>;
