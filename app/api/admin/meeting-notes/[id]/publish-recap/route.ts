import { NextRequest, NextResponse } from "next/server";
import { publishRecap } from "@/lib/db/meetingNotes";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json().catch(() => null);

  const decisions = Array.isArray(body?.decisions)
    ? body.decisions.filter((d: unknown): d is string => typeof d === "string")
    : [];
  const details = Array.isArray(body?.details)
    ? body.details.filter(
        (d: unknown): d is { label: string; title: string; body: string } =>
          typeof d === "object" &&
          d !== null &&
          typeof (d as { label?: unknown }).label === "string" &&
          typeof (d as { title?: unknown }).title === "string" &&
          typeof (d as { body?: unknown }).body === "string"
      )
    : [];
  const shortVersion = typeof body?.shortVersion === "string" ? body.shortVersion : "";
  const focus = typeof body?.focus === "string" ? body.focus : "";

  const note = await publishRecap(id, { decisions, details, shortVersion, focus });
  return NextResponse.json({ recapSlug: note.recapSlug });
}
