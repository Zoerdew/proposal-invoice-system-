import { NextRequest, NextResponse } from "next/server";
import { getClientByToken } from "@/lib/db/clients";
import { isRateLimited, recordLoginAttempt } from "@/lib/db/portalLoginAttempts";
import { createSignedToken, MAGIC_LINK_TTL_SECONDS } from "@/lib/portalAuth";
import { sendPortalLoginEmail } from "@/lib/email";

const GENERIC_MESSAGE = "If that email matches a client on this link, we've sent a login link.";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const client = await getClientByToken(token);
  if (!client) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  if (!email) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  // Always record the attempt and always return the same response below —
  // an attacker guessing emails against a real token shouldn't be able to
  // tell a wrong guess from a right one, or from being rate-limited.
  await recordLoginAttempt(token);

  if (await isRateLimited(token)) {
    return NextResponse.json({ message: GENERIC_MESSAGE });
  }

  if (client.email && email.toLowerCase() === client.email.toLowerCase()) {
    const magicToken = createSignedToken(token, MAGIC_LINK_TTL_SECONDS);
    const loginUrl = new URL(
      `/api/portal/${token}/login/verify?t=${magicToken}`,
      request.nextUrl.origin
    ).toString();
    await sendPortalLoginEmail({ to: client.email, loginUrl });
  }

  return NextResponse.json({ message: GENERIC_MESSAGE });
}
