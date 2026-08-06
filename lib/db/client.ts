import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

// Service role key bypasses RLS — this must never be imported into
// client-side code. The "server-only" import above throws a build
// error if anything tries to.
function createServiceClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url) throw new Error("SUPABASE_URL is not set");
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  return createClient<Database>(url, key, {
    auth: { persistSession: false },
  });
}

let cached: ReturnType<typeof createServiceClient> | undefined;

export function db() {
  if (!cached) cached = createServiceClient();
  return cached;
}
