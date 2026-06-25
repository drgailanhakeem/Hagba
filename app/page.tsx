"use client"

import { useState, useCallback } from "react"
import { IconSidebar } from "@/components/icon-sidebar"
import { NoteListPanel, type Note } from "@/components/note-list-panel"
import { NoteEditor } from "@/components/note-editor"

// ── Seed data ──────────────────────────────────────────────────────────────
const INITIAL_NOTES: Note[] = [
  {
    id: "1",
    title: "Weekly Review — June 2025",
    preview:
      "Started the week with a clear head. Finished the onboarding redesign and got positive feedback from the team. Need to follow up on the API rate-limiting ticket before Thursday.",
    date: "Today",
    tags: [
      { label: "Work", color: "bg-amber-100", textColor: "text-amber-700" },
      { label: "Weekly", color: "bg-sky-100", textColor: "text-sky-700" },
    ],
  },
  {
    id: "2",
    title: "Reading notes: Thinking, Fast and Slow",
    preview:
      "System 1 operates automatically and quickly, with little or no effort and no sense of voluntary control. System 2 allocates attention to the effortful mental activities.",
    date: "Yesterday",
    tags: [
      { label: "Books", color: "bg-emerald-100", textColor: "text-emerald-700" },
    ],
  },
  {
    id: "3",
    title: "Side project ideas",
    preview:
      "A minimal Pomodoro app with a physical-timer aesthetic. A recipe manager that works offline. Possibly a local-first journaling tool with end-to-end encryption.",
    date: "Jun 19",
    tags: [
      { label: "Ideas", color: "bg-rose-100", textColor: "text-rose-700" },
      { label: "Dev", color: "bg-violet-100", textColor: "text-violet-700" },
    ],
  },
  {
    id: "4",
    title: "Coffee tasting log",
    preview:
      "Ethiopia Yirgacheffe — floral, bergamot, light body. Brewed at 93°C with a 1:16 ratio on the V60. Best extraction time around 3:20.",
    date: "Jun 17",
    tags: [
      { label: "Personal", color: "bg-amber-100", textColor: "text-amber-700" },
    ],
  },
  {
    id: "5",
    title: "Markdown cheatsheet",
    preview:
      "# Heading 1 — ## Heading 2 — **bold** — _italic_ — `inline code` — ```code block``` — > blockquote — - list item",
    date: "Jun 14",
    tags: [
      { label: "Reference", color: "bg-sky-100", textColor: "text-sky-700" },
    ],
  },
  {
    id: "6",
    title: "Trip planning — Lisbon",
    preview:
      "Fly into LIS, stay in Alfama or Mouraria. Must-try: pastéis de nata at Pastéis de Belém. Day trip to Sintra. Book the tram 28 early.",
    date: "Jun 10",
    tags: [
      { label: "Travel", color: "bg-emerald-100", textColor: "text-emerald-700" },
      { label: "Personal", color: "bg-amber-100", textColor: "text-amber-700" },
    ],
  },
  {
    id: "7",
    title: "Typography scale notes",
    preview:
      "Using a modular scale with a 1.25 ratio. Base: 16px. H1 → 39px, H2 → 31px, H3 → 25px, body → 17px. Line height 1.8 for body, 1.2 for headings.",
    date: "Jun 8",
    tags: [
      { label: "Design", color: "bg-violet-100", textColor: "text-violet-700" },
    ],
  },
  {
    id: "8",
    title: "Quotes worth remembering",
    preview:
      "\"The scariest moment is always just before you start.\" — Stephen King. \"You miss 100% of the shots you don't take.\" — Wayne Gretzky",
    date: "Jun 3",
    tags: [
      { label: "Inspiration", color: "bg-rose-100", textColor: "text-rose-700" },
    ],
  },
]

// ── Page ───────────────────────────────────────────────────────────────────
export default function Page() {
  const [notes, setNotes] = useState<Note[]>(INITIAL_NOTES)
  const [activeNoteId, setActiveNoteId] = useState<string>(INITIAL_NOTES[0].id)
  const [activeNav, setActiveNav] = useState<"inbox" | "notes" | "tags" | "search">("notes")

  const activeNote = notes.find((n) => n.id === activeNoteId) ?? null

  const handleUpdate = useCallback((id: string, changes: Partial<Pick<Note, "title" | "preview">>) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, ...changes } : n))
    )
  }, [])

  const handleNewNote = useCallback(() => {
    const id = `new-${Date.now()}`
    const newNote: Note = {
      id,
      title: "Untitled",
      preview: "",
      date: "Just now",
      tags: [],
    }
    setNotes((prev) => [newNote, ...prev])
    setActiveNoteId(id)
  }, [])

  return (
    <div className="flex h-full w-full overflow-hidden" style={{ backgroundColor: "#1C1C1E" }}>
      {/* Column 1 — Icon sidebar */}
      <IconSidebar active={activeNav} onSelect={setActiveNav} />

      {/* Column 2 — Note list */}
      <NoteListPanel
        notes={notes}
        activeId={activeNoteId}
        onSelect={setActiveNoteId}
        onNew={handleNewNote}
      />

      {/* Column 3 — Editor */}
      <NoteEditor note={activeNote} onUpdate={handleUpdate} />
    </div>
  )
}
