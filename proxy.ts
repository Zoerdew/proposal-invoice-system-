import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthed } from "@/lib/adminAuth";
import { verifySignedToken, PORTAL_SESSION_COOKIE } from "@/lib/portalAuth";

const PORTAL_API_PREFIXES = ["checkins", "client", "findings", "onboarding", "portal", "proof"];

// Extracts the client's portal token from any of the token-scoped route
// shapes found in this codebase: /c/[token]/... (token at index 1) and
// /api/{checkins,client,findings,onboarding,portal,proof}/[token]/...
// (token at index 2). Returns null for anything else.
function extractPortalToken(pathname: string): string | null {
  const parts = pathname.split("/").filter(Boolean);
  if (parts[0] === "c") return parts[1] ?? null;
  if (parts[0] === "api" && PORTAL_API_PREFIXES.includes(parts[1])) return parts[2] ?? null;
  return null;
}

// The login flow itself has to stay reachable without a session — same
// spirit as the /admin/login exclusion below.
function isPortalLoginPath(pathname: string): boolean {
  const parts = pathname.split("/").filter(Boolean);
  if (parts[0] === "c" && parts[2] === "login") return true; // /c/[token]/login
  if (parts[0] === "api" && parts[1] === "portal" && parts[3] === "login") return true; // /api/portal/[token]/login(/verify)
  return false;
}

// Next.js 16 renamed Middleware to Proxy — same mechanism, new filename.
export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/admin/login" || pathname === "/api/admin/login") {
    return NextResponse.next();
  }

  const authed = await isAdminAuthed();

  if (pathname.startsWith("/api/admin")) {
    if (!authed) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/admin") && !authed) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  // Phase 14: magic-link login layered in front of the existing
  // token-based portal access — the token in the URL stays the source of
  // truth for *which* client, this just also requires a verified session
  // cookie scoped to that same token before rendering or accepting writes.
  if (!isPortalLoginPath(pathname)) {
    const portalToken = extractPortalToken(pathname);
    if (portalToken) {
      const cookie = request.cookies.get(PORTAL_SESSION_COOKIE)?.value;
      const verified = cookie ? verifySignedToken(cookie) : null;
      const sessionValid = verified?.portalToken === portalToken;

      // "View as client" (admin panel): a logged-in admin can browse any
      // /c/[token] page without the client's own session, so Zoë can see
      // exactly what a given client sees. Deliberately doesn't extend to
      // the portal's own API routes below — an admin session alone can't
      // toggle a to-do or submit a form as the client, so browsing a
      // client's portal never risks writing to their real record.
      const viewingAsAdmin = authed && !pathname.startsWith("/api/");

      if (!sessionValid && !viewingAsAdmin) {
        if (pathname.startsWith("/api/")) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        return NextResponse.redirect(new URL(`/c/${portalToken}/login`, request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/admin/:path*",
    "/c/:path*",
    "/api/checkins/:path*",
    "/api/client/:path*",
    "/api/findings/:path*",
    "/api/onboarding/:path*",
    "/api/portal/:path*",
    "/api/proof/:path*",
  ],
};
