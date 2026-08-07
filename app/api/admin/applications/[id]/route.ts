import { NextRequest, NextResponse } from "next/server";
import { APPLICATION_STATUS_OPTIONS, updateApplicationStatus } from "@/lib/db/applications";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json().catch(() => null);

  const status = body?.status;
  if (!(APPLICATION_STATUS_OPTIONS as readonly string[]).includes(status)) {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }

  const fitNotesPrivate = typeof body?.fitNotesPrivate === "string" ? body.fitNotesPrivate : undefined;

  const application = await updateApplicationStatus(id, status, fitNotesPrivate);
  return NextResponse.json({ ok: true, status: application.status });
}
