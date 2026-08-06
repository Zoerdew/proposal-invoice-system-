import { NextRequest, NextResponse } from "next/server";
import { getClientByToken } from "@/lib/db/clients";
import { getFindingsByClientId } from "@/lib/db/findings";

export async function GET(
  _req: NextRequest,
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

  const findings = await getFindingsByClientId(client.id);
  return NextResponse.json(findings);
}
