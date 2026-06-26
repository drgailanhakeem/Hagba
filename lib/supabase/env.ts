/**
 * Resolve the Supabase URL and anon key from whichever env var names are
 * present. The Supabase integration may inject these under a doubled
 * `NEXT_PUBLIC_SUPABASE_SUPABASE_*` prefix, while a manual setup uses the
 * plain `NEXT_PUBLIC_SUPABASE_*` names. Each name is referenced literally so
 * Next.js can inline the value into the client bundle at build time.
 */
export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_SUPABASE_URL ||
  ""

export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_SUPABASE_PUBLISHABLE_KEY ||
  ""

// NOTE: The service-role key intentionally lives in `./env.server` (guarded by
// "server-only"), NOT here. This module is imported by the browser client, so
// referencing any NEXT_PUBLIC_*SERVICE_ROLE* / *SECRET* name here would inline
// the secret into the client bundle.
