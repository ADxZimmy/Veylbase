import { NextResponse } from "next/server";
import { transactionPlanRequestSchema } from "@/server/transactions/schema";
import { buildTransactionPlan } from "@/server/transactions/planner";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON." },
      { status: 400 }
    );
  }

  const parsed = transactionPlanRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid transaction plan request.",
        issues: parsed.error.issues
      },
      { status: 400 }
    );
  }

  try {
    const plan = await buildTransactionPlan(parsed.data);
    return NextResponse.json(plan);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to build transaction plan."
      },
      { status: 422 }
    );
  }
}
