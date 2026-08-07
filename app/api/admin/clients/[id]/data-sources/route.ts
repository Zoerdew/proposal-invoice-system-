import { NextRequest, NextResponse } from "next/server";
import { replaceDataSources } from "@/lib/db/dataSources";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const items = Array.isArray(body?.items) ? body.items : [];

  await replaceDataSources(
    id,
    items
      .filter((item: { kind?: unknown }) => typeof item.kind === "string" && item.kind.trim())
      .map((item: { kind: string; periodCovered?: string; receivedAt?: string; fileUrl?: string }) => ({
        kind: item.kind,
        periodCovered: item.periodCovered,
        receivedAt: item.receivedAt,
        fileUrl: item.fileUrl,
      }))
  );

  return NextResponse.json({ ok: true });
}
