import { NextRequest, NextResponse } from "next/server";
import { matchMeetingNoteToClient } from "@/lib/db/meetingNotes";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const clientId = typeof body?.clientId === "string" ? body.clientId : "";

  if (!clientId) {
    return NextResponse.json({ error: "clientId is required." }, { status: 400 });
  }

  await matchMeetingNoteToClient(id, clientId);
  return NextResponse.json({ ok: true });
}
