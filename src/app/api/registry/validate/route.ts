import { NextRequest, NextResponse } from "next/server";
import { addressKey } from "@/lib/addresses";
import { getRegistrySnapshot } from "@/server/registry/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function asBoolean(value: string | null, defaultValue: boolean) {
  if (value === null) return defaultValue;
  return value === "true" || value === "1";
}

export async function GET(request: NextRequest) {
  const live = asBoolean(request.nextUrl.searchParams.get("live"), false);
  const snapshot = await getRegistrySnapshot({ live });
  const underlying = new Set<string>();
  const confidential = new Set<string>();
  const duplicateAddresses: string[] = [];

  for (const pair of snapshot.pairs) {
    const underlyingKey = addressKey(pair.underlying.address);
    const confidentialKey = addressKey(pair.confidential.address);

    if (underlying.has(underlyingKey)) duplicateAddresses.push(pair.underlying.address);
    if (confidential.has(confidentialKey)) {
      duplicateAddresses.push(pair.confidential.address);
    }

    underlying.add(underlyingKey);
    confidential.add(confidentialKey);
  }

  const checks = [
    {
      id: "all-official-pairs-present",
      label: "All official Sepolia cTokenMock pairs are present",
      passed: snapshot.coverage.officialPairs >= 8
    },
    {
      id: "public-faucet-coverage",
      label: "Public mock faucet pairs are claimable",
      passed: snapshot.coverage.publicMintPairs >= 7
    },
    {
      id: "wrap-unwrap-coverage",
      label: "Every valid pair exposes wrap and unwrap capabilities",
      passed: snapshot.pairs
        .filter((pair) => pair.valid)
        .every((pair) => pair.capabilities.wrap && pair.capabilities.unwrap)
    },
    {
      id: "decrypt-coverage",
      label: "Every pair exposes balance decryption capability",
      passed: snapshot.pairs.every((pair) => pair.capabilities.decrypt)
    },
    {
      id: "no-duplicate-addresses",
      label: "No duplicate underlying or confidential token addresses",
      passed: duplicateAddresses.length === 0,
      details: duplicateAddresses
    }
  ];

  return NextResponse.json({
    passed: checks.every((check) => check.passed),
    checks,
    coverage: snapshot.coverage,
    sourceHealth: snapshot.sourceHealth,
    warnings: snapshot.warnings
  });
}
