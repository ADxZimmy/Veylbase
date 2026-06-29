import { NextRequest, NextResponse } from "next/server";
import { getRegistrySnapshot } from "@/server/registry/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function asBoolean(value: string | null, defaultValue: boolean) {
  if (value === null) return defaultValue;
  return value === "true" || value === "1";
}

function asPositiveInteger(value: string | null, defaultValue: number) {
  if (!value) return defaultValue;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : defaultValue;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const snapshot = await getRegistrySnapshot({
    live: asBoolean(searchParams.get("live"), false),
    includeLocal: asBoolean(searchParams.get("includeLocal"), true),
    page: asPositiveInteger(searchParams.get("page"), 1),
    pageSize: asPositiveInteger(searchParams.get("pageSize"), 100)
  });

  return NextResponse.json(snapshot);
}
