import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { fetchPublicNote } from "@/lib/db"
import { sanitizeNoteHtml } from "@/lib/sanitize-note"
import { ShareView } from "./share-view"

interface SharePageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: SharePageProps): Promise<Metadata> {
  const { id } = await params
  try {
    const supabase = await createClient()
    const note = await fetchPublicNote(supabase, id)
    if (note) {
      const title = note.title.trim() || "Untitled note"
      return {
        title: `${title} · Hagba`,
        description: "A note shared from Hagba.",
      }
    }
  } catch {
    // fall through to default metadata
  }
  return { title: "Shared note · Hagba" }
}

export default async function SharePage({ params }: SharePageProps) {
  const { id } = await params
  const supabase = await createClient()
  const note = await fetchPublicNote(supabase, id)

  if (!note) {
    notFound()
  }

  // Sanitize the stored HTML before it is rendered with dangerouslySetInnerHTML
  // on this public page (defends against stored XSS via crafted note content).
  const safeNote = { ...note, content: sanitizeNoteHtml(note.content) }

  return <ShareView note={safeNote} />
}
