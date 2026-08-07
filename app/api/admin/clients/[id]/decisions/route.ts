import { NextRequest, NextResponse } from "next/server";
import { replaceDecisions } from "@/lib/db/decisions";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const items = Array.isArray(body?.items) ? body.items : [];

  await replaceDecisions(
    id,
    items
      .filter((item: { decision?: unknown }) => typeof item.decision === "string" && item.decision.trim())
      .map((item: { decision: string; promptedByNumber?: string; expected?: string; outcome?: string; decidedAt?: string }) => ({
        decision: item.decision,
        promptedByNumber: item.promptedByNumber,
        expected: item.expected,
        outcome: item.outcome,
        decidedAt: item.decidedAt,
      }))
  );

  return NextResponse.json({ ok: true });
}
