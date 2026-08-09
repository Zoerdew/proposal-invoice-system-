import { NextRequest, NextResponse } from "next/server";
import { getClientByToken } from "@/lib/db/clients";
import { createCheckin } from "@/lib/db/checkIns";
import { sendSlackAlert } from "@/lib/slack";

const FELT_LIKE_OPTIONS = ["Ahead", "On track", "Behind"] as const;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const client = await getClientByToken(token);

  if (!client) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  // Fixed while porting (BUILD-SPEC.md): the page-level gate that redirects
  // to onboarding doesn't cover API routes hit directly.
  if (!client.onboardingComplete) {
    return NextResponse.json({ error: "Complete onboarding first" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const revenueThisWeek = Number(body?.revenueThisWeek);
  const qualitativeNotes = body?.qualitativeNotes;
  const feltLike = body?.feltLike;

  if (
    !Number.isFinite(revenueThisWeek) ||
    typeof qualitativeNotes !== "string" ||
    !qualitativeNotes.trim() ||
    !FELT_LIKE_OPTIONS.includes(feltLike)
  ) {
    return NextResponse.json({ error: "Invalid check-in data" }, { status: 400 });
  }

  const checkin = await createCheckin(client.id, {
    revenueThisWeek,
    qualitativeNotes,
    feltLike,
  });

  await sendSlackAlert(
    `✅ Check-in from *${client.name}* — felt ${feltLike.toLowerCase()}, £${revenueThisWeek} this week.`
  );

  return NextResponse.json(checkin, { status: 201 });
}
