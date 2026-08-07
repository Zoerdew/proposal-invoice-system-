import { NextRequest, NextResponse } from "next/server";
import { replaceFindings } from "@/lib/db/findings";
import type { FindingType } from "@/lib/db/shared";
import type { FindingStatus } from "@/lib/db/findings";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const items = Array.isArray(body?.items) ? body.items : [];

  await replaceFindings(
    id,
    items
      .filter((item: { title?: unknown }) => typeof item.title === "string" && item.title.trim())
      .map((item: {
        title: string;
        type: FindingType;
        description?: string;
        value?: number;
        status?: FindingStatus;
        dateFound?: string;
        source?: string;
      }) => ({
        title: item.title,
        type: item.type,
        description: item.description,
        value: item.value,
        status: item.status,
        dateFound: item.dateFound,
        source: item.source,
      }))
  );

  return NextResponse.json({ ok: true });
}
