// The Supabase connection for the server only. It uses the secret service role
// key, so it must never be imported by a "use client" file.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null | undefined;

/** null when SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY aren't set (e.g. on your computer without a .env.local). */
export function supabaseAdmin(): SupabaseClient | null {
  if (client !== undefined) return client;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  client = url && key ? createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } }) : null;
  return client;
}
