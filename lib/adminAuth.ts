import { cookies } from "next/headers";

export const ADMIN_COOKIE = "pis_admin_session";

// The value stored in the login cookie. Anyone without this exact value is not logged in.
export function sessionToken(): string {
  return process.env.SESSION_SECRET || "dev-secret-change-me";
}

export async function isAdminAuthed(): Promise<boolean> {
  const jar = await cookies();
  return jar.get(ADMIN_COOKIE)?.value === sessionToken();
}
