import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForTokens } from "@/lib/xero";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const expectedState = request.cookies.get("xero_oauth_state")?.value;

  if (!code || !state || !expectedState || state !== expectedState) {
    return NextResponse.json(
      { error: "Invalid or missing OAuth state/code." },
      { status: 400 }
    );
  }

  try {
    await exchangeCodeForTokens(code);
  } catch (err) {
    console.error("Xero OAuth callback failed:", err);
    return NextResponse.json(
      { error: "Failed to connect Xero. Check server logs." },
      { status: 500 }
    );
  }

  const res = NextResponse.redirect(new URL("/xero/connected", request.url));
  res.cookies.delete("xero_oauth_state");
  return res;
}
