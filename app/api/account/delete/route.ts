import { NextResponse } from "next/server"
import { createClient as createServerClient } from "@/lib/supabase/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"
import { SUPABASE_URL } from "@/lib/supabase/env"
import { SUPABASE_SERVICE_ROLE_KEY } from "@/lib/supabase/env.server"

export async function POST() {
  // Identify the signed-in user from their session cookies.
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  if (!SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      { error: "Server is not configured to delete accounts." },
      { status: 500 },
    )
  }

  const admin = createAdminClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  try {
    // Remove the user's stored avatars (best-effort).
    const { data: files } = await admin.storage.from("avatars").list(user.id)
    if (files && files.length > 0) {
      await admin.storage
        .from("avatars")
        .remove(files.map((f) => `${user.id}/${f.name}`))
    }

    // Deleting the auth user cascades to notes/tasks/projects/user_settings
    // via their `on delete cascade` foreign keys.
    const { error } = await admin.auth.admin.deleteUser(user.id)
    if (error) throw error

    // Clear the session.
    await supabase.auth.signOut()

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[Hagba] delete account failed:", err)
    return NextResponse.json({ error: "Failed to delete account." }, { status: 500 })
  }
}
