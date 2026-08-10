import { createHmac, timingSafeEqual } from "crypto";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set`);
  return value;
}

export const PORTAL_SESSION_COOKIE = "pis_portal_session";
export const PORTAL_SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days
export const MAGIC_LINK_TTL_SECONDS = 60 * 15; // 15 minutes

function base64url(input: Buffer | string): string {
  return (typeof input === "string" ? Buffer.from(input) : input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function base64urlDecode(input: string): Buffer {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(padded, "base64");
}

function sign(data: string): string {
  return base64url(createHmac("sha256", requireEnv("SESSION_SECRET")).update(data).digest());
}

// Reuses SESSION_SECRET (already used by the plain shared-secret admin
// cookie) as the HMAC key — no new secret needed. Unlike admin auth, this
// carries a real signed payload: {portalToken, exp}. Used for both the
// short-lived magic-link email token and the long-lived session cookie,
// just with different ttlSeconds — same primitive, same verification.
export function createSignedToken(portalToken: string, ttlSeconds: number): string {
  const payload = JSON.stringify({
    portalToken,
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
  });
  const encodedPayload = base64url(payload);
  const signature = sign(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

export function verifySignedToken(token: string): { portalToken: string } | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [encodedPayload, signature] = parts;

  const expected = sign(encodedPayload);
  const sigBuf = Buffer.from(signature);
  const expectedBuf = Buffer.from(expected);
  if (sigBuf.length !== expectedBuf.length || !timingSafeEqual(sigBuf, expectedBuf)) {
    return null;
  }

  let payload: { portalToken?: unknown; exp?: unknown };
  try {
    payload = JSON.parse(base64urlDecode(encodedPayload).toString("utf8"));
  } catch {
    return null;
  }

  if (typeof payload.portalToken !== "string" || typeof payload.exp !== "number") return null;
  if (payload.exp < Math.floor(Date.now() / 1000)) return null;

  return { portalToken: payload.portalToken };
}
