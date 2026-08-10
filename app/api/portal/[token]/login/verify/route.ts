import { NextRequest, NextResponse } from "next/server";
import { verifySignedToken, PORTAL_SESSION_COOKIE, PORTAL_SESSION_TTL_SECONDS, createSignedToken } from "@/lib/portalAuth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const magicToken = request.nextUrl.searchParams.get("t") ?? "";

  const verified = verifySignedToken(magicToken);
  if (!verified || verified.portalToken !== token) {
    return NextResponse.redirect(new URL(`/c/${token}/login?error=expired`, request.nextUrl.origin));
  }

  // Reuses existing onboarding logic (already redirects to /snapshot once
  // onboarding is complete) rather than duplicating that branching here.
  const response = NextResponse.redirect(
    new URL(`/c/${token}/onboarding`, request.nextUrl.origin)
  );
  response.cookies.set(
    PORTAL_SESSION_COOKIE,
    createSignedToken(token, PORTAL_SESSION_TTL_SECONDS),
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: PORTAL_SESSION_TTL_SECONDS,
    }
  );
  return response;
}
