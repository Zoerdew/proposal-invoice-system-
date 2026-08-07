import { NextRequest, NextResponse } from "next/server";
import { getClientAdmin } from "@/lib/db/clients";
import { sendOnboardingEmail } from "@/lib/email";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const client = await getClientAdmin(id).catch(() => null);
  if (!client) {
    return NextResponse.json({ error: "Client not found." }, { status: 404 });
  }

  const onboardingUrl = new URL(`/c/${client.portalToken}/onboarding`, request.nextUrl.origin).toString();
  await sendOnboardingEmail({
    to: client.email,
    firstName: client.firstName || client.name,
    onboardingUrl,
  });

  return NextResponse.json({ ok: true });
}
