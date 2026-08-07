import { NextRequest, NextResponse } from "next/server";
import { replaceMetrics } from "@/lib/db/metrics";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const items = Array.isArray(body?.items) ? body.items : [];

  await replaceMetrics(
    id,
    items
      .filter((item: { name?: unknown }) => typeof item.name === "string" && item.name.trim())
      .map((item: { id?: string; name: string; definition?: string; baseline?: number; target?: number }) => ({
        id: item.id,
        name: item.name,
        definition: item.definition,
        baseline: item.baseline,
        target: item.target,
      }))
  );

  return NextResponse.json({ ok: true });
}
