import { NextRequest, NextResponse } from "next/server";
import { createLead, getLeadByEmail } from "@/lib/db/leads";
import { splitFullName } from "@/lib/db/clients";

// Fired by a Zap watching Zoë's Google Calendar for new intro-call bookings
// (she books directly on Calendar rather than through a dedicated tool like
// Calendly) — same pattern as app/api/webhooks/meeting-notes/route.ts,
// Bearer-token protected with its own secret rather than reusing
// MEETING_NOTES_WEBHOOK_SECRET, since it's a distinct external trigger.
//
// The Zap is responsible for only firing on actual intro-call bookings
// (e.g. filtered to a specific calendar or event-title pattern) — this
// route trusts whatever it's sent and just needs an email to act on.
export async function POST(request: NextRequest) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.INTRO_CALL_WEBHOOK_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const eventTitle = typeof body?.eventTitle === "string" ? body.eventTitle.trim() : "";
  const eventTime = typeof body?.eventTime === "string" ? body.eventTime.trim() : "";

  if (!email) {
    return NextResponse.json({ error: "email is required." }, { status: 400 });
  }

  const existing = await getLeadByEmail(email);
  if (existing) {
    return NextResponse.json({ ok: true, skipped: "lead already exists", leadId: existing.id });
  }

  const { firstName, lastName } = splitFullName(name);
  const lead = await createLead({
    firstName: firstName || null,
    lastName: lastName || null,
    email,
    source: "Intro call booking",
    notes: eventTitle ? `Booked: ${eventTitle}` : null,
    firstContactDate: eventTime ? eventTime.slice(0, 10) : new Date().toISOString().slice(0, 10),
  });

  return NextResponse.json({ ok: true, leadId: lead.id });
}
