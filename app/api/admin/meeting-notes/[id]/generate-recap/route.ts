import { NextRequest, NextResponse } from "next/server";
import { getMeetingNote } from "@/lib/db/meetingNotes";
import { extractCallRecapDetails } from "@/lib/anthropic";

// No DB write — mirrors Phase 11's generate/save split, so a bad
// generation can be re-rolled without leaving anything behind.
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const note = await getMeetingNote(id).catch(() => null);
  if (!note) {
    return NextResponse.json({ error: "Meeting note not found." }, { status: 404 });
  }

  const details = await extractCallRecapDetails(note.rawContent);
  return NextResponse.json(details);
}
