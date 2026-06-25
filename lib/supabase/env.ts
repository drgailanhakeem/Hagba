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

/**
 * Service-role key — SERVER ONLY. Never import this into client components.
 * Used by route handlers (e.g. account deletion) that need admin privileges.
 */
export const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_SUPABASE_SECRET_KEY ||
  ""
