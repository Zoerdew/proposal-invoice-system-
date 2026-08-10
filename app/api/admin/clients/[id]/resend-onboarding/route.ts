import { NextRequest, NextResponse } from "next/server";
import { getClientAdmin } from "@/lib/db/clients";
import { sendOnboardingEmail } from "@/lib/email";
import { createSignedToken, MAGIC_LINK_TTL_SECONDS } from "@/lib/portalAuth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const client = await getClientAdmin(id).catch(() => null);
  if (!client) {
    return NextResponse.json({ error: "Client not found." }, { status: 404 });
  }

  // The link itself is a magic link (Phase 14) — see create-client/route.ts.
  const magicToken = createSignedToken(client.portalToken, MAGIC_LINK_TTL_SECONDS);
  const onboardingUrl = new URL(
    `/api/portal/${client.portalToken}/login/verify?t=${magicToken}`,
    request.nextUrl.origin
  ).toString();
  await sendOnboardingEmail({
    to: client.email,
    firstName: client.firstName || client.name,
    onboardingUrl,
  });

  return NextResponse.json({ ok: true });
}
