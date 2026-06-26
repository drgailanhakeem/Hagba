import "server-only"

/**
 * Service-role key — SERVER ONLY.
 *
 * The `server-only` import above makes the build fail if this module is ever
 * pulled into a client component, so the secret can never be inlined into the
 * browser bundle.
 *
 * Only the non-public `SUPABASE_SERVICE_ROLE_KEY` env var is read. A
 * service-role key must never be exposed under a `NEXT_PUBLIC_*` name, because
 * Next.js inlines those into client-side JavaScript. The service-role key
 * bypasses Row Level Security, so leaking it would compromise the entire
 * database.
 *
 * Used by route handlers (e.g. account deletion) that need admin privileges.
 */
export const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
