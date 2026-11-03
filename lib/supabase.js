import { createClient } from '@supabase/supabase-js';

let cached = null;

export function supabaseConfigured() {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

// Server-only client using the service role key. Never import this from a
// client component. Returns null when the database is not configured yet, so
// the app still builds and the public site keeps working.
export function getSupabase() {
  if (cached) return cached;
  if (!supabaseConfigured()) return null;
  cached = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
  return cached;
}
