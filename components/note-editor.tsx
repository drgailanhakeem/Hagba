"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { Share2, MoreHorizontal, Tag } from "lucide-react"
import type { Note } from "./note-list-panel"
import { RichEditor, type RichEditorRef } from "./editor/rich-editor"
import { PomodoroTimer } from "./pomodoro-timer"

import type { TagEntry } from "@/lib/tags"

interface NoteEditorProps {
  note: Note | null
  onUpdate: (id: string, changes: Partial<Pick<Note, "title" | "preview">>) => void
  initialContent?: string
  existingTags?: TagEntry[]
  onTagCreated?: (label: string) => void
}

type SaveStatus = "idle" | "saving" | "saved"

function formatLastSaved(date: Date): string {
  const now = new Date()
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000)
  const diffMin = Math.floor(diffSec / 60)
  if (diffSec < 10) return "Saved"
  if (diffSec < 60) return `Saved ${diffSec}s ago`
  if (diffMin === 1) return "Saved 1 min ago"
  if (diffMin < 60) return `Saved ${diffMin} mins ago`
  return `Saved at ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
}

// Map note IDs to their HTML content for session persistence
const noteContentMap = new Map<string, string>()

export function NoteEditor({ note, onUpdate, initialContent: seedContent, existingTags = [], onTagCreated }: NoteEditorProps) {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle")
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [lastSavedLabel, setLastSavedLabel] = useState("")
  const [titleValue, setTitleValue] = useState(note?.title ?? "")
  const [wordCount, setWordCount] = useState(0)
  const [isTitleFocused, setIsTitleFocused] = useState(false)
  const editorRef = useRef<RichEditorRef>(null)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const savingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const currentNoteId = useRef<string | null>(null)

  // Sync title & content when active note changes
  useEffect(() => {
    if (!note) return
    setTitleValue(note.title)
    setSaveStatus("idle")
    setLastSaved(null)
    setLastSavedLabel("")
    currentNoteId.current = note.id

    // Seed content map — prefer the passed-in HTML, fall back to preview text
    if (!noteContentMap.has(note.id)) {
      noteContentMap.set(
        note.id,
        seedContent ?? (note.preview ? `<p>${note.preview}</p>` : "<p></p>")
      )
    }
  }, [note?.id])

  // Tick label every 15s
  useEffect(() => {
    if (!lastSaved) return
    const interval = setInterval(() => {
      setLastSavedLabel(formatLastSaved(lastSaved))
    }, 15_000)
    return () => clearInterval(interval)
  }, [lastSaved])

  const triggerSave = useCallback(
    (html: string, text: string) => {
      if (!note) return

      // Store in local content map
      noteContentMap.set(note.id, html)

      // Show "Saving…" immediately then "Saved" after debounce
      setSaveStatus("saving")
      if (savingTimerRef.current) clearTimeout(savingTimerRef.current)
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)

      saveTimerRef.current = setTimeout(() => {
        onUpdate(note.id, {
          title: titleValue,
          preview: text.slice(0, 140),
        })
        const now = new Date()
        setLastSaved(now)
        setLastSavedLabel(formatLastSaved(now))
        setSaveStatus("saved")

        // Fade back to idle after 3s
        savingTimerRef.current = setTimeout(() => {
          setSaveStatus("idle")
        }, 3000)
      }, 800)
    },
    [note, titleValue, onUpdate]
  )

  const handleTitleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setTitleValue(e.target.value)
      if (!note) return
      setSaveStatus("saving")
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      saveTimerRef.current = setTimeout(() => {
        onUpdate(note.id, { title: e.target.value })
        const now = new Date()
        setLastSaved(now)
        setLastSavedLabel(formatLastSaved(now))
        setSaveStatus("saved")
        savingTimerRef.current = setTimeout(() => setSaveStatus("idle"), 3000)
      }, 600)
    },
    [note, onUpdate]
  )

  const handleEditorUpdate = useCallback(
    (html: string, text: string) => {
      setWordCount(text.split(/\s+/).filter(Boolean).length)
      triggerSave(html, text)
    },
    [triggerSave]
  )

  if (!note) {
    return (
      <main
        className="flex-1 flex items-center justify-center h-full"
        style={{ backgroundColor: "#FAF9F7" }}
      >
        <div className="text-center" style={{ color: "#C8C4BC" }}>
          <svg
            width="36"
            height="36"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.25"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ margin: "0 auto 12px" }}
            aria-hidden="true"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
          <p className="font-medium" style={{ fontSize: 15, marginBottom: 4 }}>
            No note selected
          </p>
          <p style={{ fontSize: 13 }}>
            Choose a note from the list or create a new one.
          </p>
        </div>
      </main>
    )
  }

  // Resolve content synchronously so RichEditor gets it on first render.
  // The useEffect may not have fired yet, so we also set the map here if missing.
  if (!noteContentMap.has(note.id)) {
    noteContentMap.set(
      note.id,
      seedContent ?? (note.preview ? `<p>${note.preview}</p>` : "<p></p>")
    )
  }
  const initialContent = noteContentMap.get(note.id) ?? "<p></p>"

  return (
    <main
      className="flex flex-col flex-1 h-full"
      style={{ backgroundColor: "#FAF9F7" }}
      aria-label="Note editor"
    >
      {/* ── Top bar ── */}
      <header
        className="flex items-center justify-between px-8 shrink-0"
        style={{
          borderBottom: "1px solid #EAE6E0",
          minHeight: 56,
          paddingTop: 10,
          paddingBottom: 10,
        }}
      >
        {/* Editable note title */}
        <input
          type="text"
          value={titleValue}
          onChange={handleTitleChange}
          onFocus={() => setIsTitleFocused(true)}
          onBlur={() => setIsTitleFocused(false)}
          aria-label="Note title — editor"
          placeholder="Untitled"
          className="title-input flex-1 bg-transparent font-semibold"
          style={{
            fontFamily: "'iA Writer Quattro S', 'Georgia', 'Times New Roman', serif",
            fontSize: 26,
            color: "#1C1B19",
            border: "none",
            padding: 0,
            maxWidth: "55%",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        />

        {/* Right side: save status + actions */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Save status indicator */}
          {saveStatus !== "idle" && (
            <span
              aria-live="polite"
              className="save-status"
              style={{
                fontSize: 12,
                color: saveStatus === "saving" ? "#B8B4AC" : "#4CAF82",
                fontFamily: "system-ui, sans-serif",
                letterSpacing: "0.01em",
              }}
            >
              {saveStatus === "saving" ? "Saving…" : lastSavedLabel || "Saved"}
            </span>
          )}
          {saveStatus === "idle" && lastSavedLabel && (
            <span
              style={{
                fontSize: 12,
                color: "#C8C4BC",
                fontFamily: "system-ui, sans-serif",
              }}
            >
              {lastSavedLabel}
            </span>
          )}

          {/* Pomodoro timer */}
          <PomodoroTimer noteTitle={titleValue || note.title} />

          {/* Divider */}
          <div style={{ width: 1, height: 18, background: "#EAE6E0", flexShrink: 0 }} aria-hidden="true" />

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
          className="mx-auto pt-8 pb-24 px-8"
          style={{ maxWidth: 680 }}
        >
          {/* Tag pills */}
          {note.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {note.tags.map((tag) => (
                <span
                  key={tag.label}
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-medium ${tag.color} ${tag.textColor}`}
                  style={{ fontSize: 11, fontFamily: "system-ui, sans-serif" }}
                >
                  {tag.label}
                </span>
              ))}
            </div>
          )}

          {/* Rich editor — key forces remount on note change */}
          <RichEditor
            key={note.id}
            ref={editorRef}
            initialContent={initialContent}
            onUpdate={handleEditorUpdate}
            placeholder="Start writing… or type # for tags, / for commands"
            existingTags={existingTags}
            onTagCreated={onTagCreated}
          />
        </div>
      </div>

      {/* ── Status bar ── */}
      <footer
        className="flex items-center gap-3 px-8 py-2 shrink-0"
        style={{
          borderTop: "1px solid #EAE6E0",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <span style={{ fontSize: 11, color: "#C8C4BC" }}>{note.date}</span>
        <span style={{ fontSize: 11, color: "#D4CFC7" }}>·</span>
        <span style={{ fontSize: 11, color: "#C8C4BC" }}>
          {wordCount} {wordCount === 1 ? "word" : "words"}
        </span>
        <span style={{ fontSize: 11, color: "#D4CFC7" }}>·</span>
        <span style={{ fontSize: 11, color: "#C8C4BC" }}>
          Type <kbd
            style={{
              background: "#EDE9E2",
              border: "1px solid #D8D4CC",
              borderRadius: 3,
              padding: "0 4px",
              fontSize: 10,
              fontFamily: "system-ui, sans-serif",
              color: "#787470",
            }}
          >/</kbd> for commands
        </span>
      </footer>
    </main>
  )
}
