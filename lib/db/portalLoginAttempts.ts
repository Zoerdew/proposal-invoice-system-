import { db } from "./client";

const RATE_LIMIT_WINDOW_MINUTES = 15;
const RATE_LIMIT_MAX_ATTEMPTS = 5;

export async function recordLoginAttempt(portalToken: string): Promise<void> {
  const { error } = await db().from("portal_login_attempts").insert({ portal_token: portalToken });
  if (error) throw error;
}

// Applies to every attempt against a token, not just the legitimate
// client's own — a wrong-email guess against a valid token still counts,
// since the whole point is stopping someone from hammering a leaked token
// with guessed emails.
export async function isRateLimited(portalToken: string): Promise<boolean> {
  const since = new Date(Date.now() - RATE_LIMIT_WINDOW_MINUTES * 60 * 1000).toISOString();
  const { count, error } = await db()
    .from("portal_login_attempts")
    .select("id", { count: "exact", head: true })
    .eq("portal_token", portalToken)
    .gte("created_at", since);
  if (error) throw error;
  return (count ?? 0) >= RATE_LIMIT_MAX_ATTEMPTS;
}
