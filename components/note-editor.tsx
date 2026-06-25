"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { Share2, MoreHorizontal, Tag } from "lucide-react"
import type { Note } from "./note-list-panel"

interface NoteEditorProps {
  note: Note | null
  onUpdate: (id: string, changes: Partial<Pick<Note, "title" | "preview">>) => void
}

function formatLastSaved(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)

  if (diffSec < 10) return "Just saved"
  if (diffSec < 60) return `Saved ${diffSec}s ago`
  if (diffMin === 1) return "Saved 1 min ago"
  if (diffMin < 60) return `Saved ${diffMin} mins ago`
  return `Saved at ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
}

export function NoteEditor({ note, onUpdate }: NoteEditorProps) {
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [lastSavedLabel, setLastSavedLabel] = useState("")
  const [titleValue, setTitleValue] = useState(note?.title ?? "")
  const editorRef = useRef<HTMLDivElement>(null)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Sync title when active note changes
  useEffect(() => {
    setTitleValue(note?.title ?? "")
    if (editorRef.current && note) {
      editorRef.current.textContent = note.preview ?? ""
    }
    setLastSaved(null)
    setLastSavedLabel("")
  }, [note?.id])

  // Tick label every 15s
  useEffect(() => {
    if (!lastSaved) return
    const interval = setInterval(() => {
      setLastSavedLabel(formatLastSaved(lastSaved))
    }, 15_000)
    return () => clearInterval(interval)
  }, [lastSaved])

  const triggerSave = useCallback(() => {
    if (!note) return
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      const content = editorRef.current?.textContent ?? ""
      onUpdate(note.id, {
        title: titleValue,
        preview: content.slice(0, 140),
      })
      const now = new Date()
      setLastSaved(now)
      setLastSavedLabel(formatLastSaved(now))
    }, 800)
  }, [note, titleValue, onUpdate])

  if (!note) {
    return (
      <main
        className="flex-1 flex items-center justify-center h-full"
        style={{ backgroundColor: "#FAF9F7" }}
      >
        <div className="text-center" style={{ color: "#C8C4BC" }}>
          <p className="font-medium" style={{ fontSize: 15, marginBottom: 6 }}>No note selected</p>
          <p style={{ fontSize: 13 }}>Choose a note from the list or create a new one.</p>
        </div>
      </main>
    )
  }

  return (
    <main
      className="flex flex-col flex-1 h-full"
      style={{ backgroundColor: "#FAF9F7" }}
      aria-label="Note editor"
    >
      {/* ── Top bar ── */}
      <header
        className="flex items-center justify-between px-8 py-3 shrink-0"
        style={{ borderBottom: "1px solid #EAE6E0" }}
      >
        {/* Editable note title */}
        <input
          type="text"
          value={titleValue}
          onChange={(e) => {
            setTitleValue(e.target.value)
            triggerSave()
          }}
          aria-label="Note title"
          placeholder="Untitled"
          className="title-input flex-1 bg-transparent font-semibold truncate"
          style={{
            fontFamily: "'iA Writer Quattro S', 'Georgia', 'Times New Roman', serif",
            fontSize: 28,
            color: "#1C1B19",
            border: "none",
            padding: 0,
            maxWidth: "60%",
          }}
        />

        {/* Right side: last-saved + actions */}
        <div className="flex items-center gap-4 shrink-0">
          {lastSavedLabel && (
            <span
              aria-live="polite"
              aria-label="Save status"
              style={{ fontSize: 12, color: "#B8B4AC" }}
            >
              {lastSavedLabel}
            </span>
          )}

          {/* Tag button */}
          <button
            aria-label="Add tag"
            className="icon-btn flex items-center justify-center w-7 h-7 rounded-lg"
            style={{ color: "#9A9590" }}
          >
            <Tag size={15} strokeWidth={1.75} aria-hidden="true" />
          </button>

          {/* Share button */}
          <button
            aria-label="Share note"
            className="icon-btn flex items-center justify-center w-7 h-7 rounded-lg"
            style={{ color: "#9A9590" }}
          >
            <Share2 size={15} strokeWidth={1.75} aria-hidden="true" />
          </button>

          {/* More options */}
          <button
            aria-label="More options"
            className="icon-btn flex items-center justify-center w-7 h-7 rounded-lg"
            style={{ color: "#9A9590" }}
          >
            <MoreHorizontal size={16} strokeWidth={1.75} aria-hidden="true" />
          </button>
        </div>
      </header>

      {/* ── Writing area ── */}
      <div className="flex-1 overflow-y-auto editor-scroll">
        <div
          className="mx-auto pt-10 pb-24 px-8"
          style={{ maxWidth: 680 }}
        >
          {/* Tag pills displayed under top bar */}
          {note.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {note.tags.map((tag) => (
                <span
                  key={tag.label}
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-medium ${tag.color} ${tag.textColor}`}
                  style={{ fontSize: 11 }}
                >
                  {tag.label}
                </span>
              ))}
            </div>
          )}

          {/* Prose body */}
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            role="textbox"
            aria-label="Note content"
            aria-multiline="true"
            data-placeholder="Start writing…"
            className="editor-prose min-h-[60vh] whitespace-pre-wrap"
            onInput={triggerSave}
          />
        </div>
      </div>

      {/* ── Subtle status bar ── */}
      <footer
        className="flex items-center gap-4 px-8 py-2 shrink-0"
        style={{ borderTop: "1px solid #EAE6E0" }}
      >
        <span style={{ fontSize: 11, color: "#C8C4BC" }}>
          {note.date}
        </span>
        <span style={{ fontSize: 11, color: "#C8C4BC" }}>·</span>
        <span style={{ fontSize: 11, color: "#C8C4BC" }}>
          {editorRef.current?.textContent?.split(/\s+/).filter(Boolean).length ?? 0} words
        </span>
      </footer>
    </main>
  )
}
