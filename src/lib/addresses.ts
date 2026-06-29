import { getAddress, isAddress, zeroAddress, type Address } from "viem";

export function normalizeAddress(value: string): Address {
  if (!isAddress(value, { strict: false })) {
    throw new Error(`Invalid EVM address: ${value}`);
  }

  return getAddress(value);
}

export function isZeroAddress(value: Address) {
  return value.toLowerCase() === zeroAddress.toLowerCase();
}

export function shortAddress(value: Address) {
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

export function addressKey(value: Address) {
  return value.toLowerCase();
}
