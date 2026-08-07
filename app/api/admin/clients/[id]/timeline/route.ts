import { NextRequest, NextResponse } from "next/server";
import { replaceTimelineEvents } from "@/lib/db/timelineEvents";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const items = Array.isArray(body?.items) ? body.items : [];

  await replaceTimelineEvents(
    id,
    items
      .filter((item: { month?: unknown; whatHappened?: unknown }) => item.month && item.whatHappened)
      .map((item: { month: string; whatHappened: string }) => ({
        month: item.month,
        whatHappened: item.whatHappened,
      }))
  );

  return NextResponse.json({ ok: true });
}
