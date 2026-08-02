import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getXeroAuthorizeUrl } from "@/lib/xero";

// One-time authorization: visit /api/xero/connect, log into Zoë's Xero org,
// approve, and get redirected back through /api/xero/callback which stores
// the tokens in the Xero Connection Airtable table.
export async function GET() {
  const state = randomUUID();
  const res = NextResponse.redirect(getXeroAuthorizeUrl(state));
  res.cookies.set("xero_oauth_state", state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });
  return res;
}
