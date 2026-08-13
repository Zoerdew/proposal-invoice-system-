import { NextRequest, NextResponse } from "next/server";
import { getMeetingNoteByRecapSlug, confirmRecap } from "@/lib/db/meetingNotes";
import { getClientAdmin } from "@/lib/db/clients";
import { sendConfirmedEmail } from "@/lib/email";

// Same duplication-over-shared-util call as displayNameFromTitle in the
// recap page itself — one other caller doesn't earn a shared helper.
function displayNameFromTitle(title: string): string {
  const cleaned = title.replace(/-\s*Notes by Gemini$/i, "").trim();
  const parenMatch = cleaned.match(/\(([^)]+)\)/);
  if (parenMatch?.[1]?.trim()) return parenMatch[1].trim();
  return cleaned || "there";
}

// Not behind the Phase 14 portal login — same reasoning as the todo
// toggle route: an unlisted, noindex slug is the access model here.
// Idempotent by design: a second click doesn't re-send Zoë's email or
// overwrite the original confirmed_at.
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const note = await getMeetingNoteByRecapSlug(slug);
  if (!note) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (note.confirmedAt) {
    return NextResponse.json({ confirmedAt: note.confirmedAt });
  }

  const client = note.clientId ? await getClientAdmin(note.clientId).catch(() => null) : null;
  const clientName = client?.name || displayNameFromTitle(note.docTitle);

  const updated = await confirmRecap(note.id);

  const origin = _request.nextUrl.origin;
  await sendConfirmedEmail({
    clientName,
    pageUrl: `${origin}/recap/${slug}`,
  });

  return NextResponse.json({ confirmedAt: updated.confirmedAt });
}
