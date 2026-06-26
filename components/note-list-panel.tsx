"use client"

import { useMemo, useState, useCallback } from "react"
import {
  MoreHorizontal,
  Plus,
  Search,
  X,
  Trash2,
  FileText,
  Copy,
  Star,
  Inbox,
  FolderInput,
  Link2,
  FileDown,
} from "lucide-react"
import { ContextMenu, type ContextMenuItem } from "@/components/context-menu"
import { downloadNoteAsMarkdown } from "@/lib/export-markdown"

export interface NoteTag {
  label: string
  color: string        // tailwind bg class e.g. "bg-amber-400"
  textColor: string    // tailwind text class
}

export interface Note {
  id: string
  title: string
  preview: string
  date: string
  tags: NoteTag[]
  inInbox?: boolean
  /** Whether the note is marked as a favorite */
  isFavorite?: boolean
  /** Whether the note is publicly shared via a read-only link */
  isPublic?: boolean
  /** Rich-text HTML body, loaded from the database */
  content?: string
}

interface NoteListPanelProps {
  notes: Note[]
  activeId: string
  onSelect: (id: string) => void
  onNew: () => void
  onDelete?: (id: string) => void
  onDuplicate?: (id: string) => void
  /** Toggle a note between Inbox and Notes */
  onToggleInbox?: (id: string) => void
  /** Toggle a note's favorite status */
  onToggleFavorite?: (id: string) => void
  /** When set, only notes with this tag (lowercase) are shown */
  filterTag?: string | null
}

// ── Highlight helper ────────────────────────────────────────────────────────
// Wraps matched substrings in a <mark> element (styled inline).
function HighlightText({
  text,
  query,
  maxLength,
}: {
  text: string
  query: string
  maxLength?: number
}) {
  const display = maxLength ? text.slice(0, maxLength) : text
  if (!query) return <>{display}</>

  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const regex = new RegExp(`(${escaped})`, "gi")
  const parts = display.split(regex)

  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark
            key={i}
            style={{
              background: "#FEF3C7",
              color: "#92400E",
              borderRadius: 2,
              padding: "0 1px",
            }}
          >
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  )
}

export function NoteListPanel({
  notes,
  activeId,
  onSelect,
  onNew,
  onDelete,
  onDuplicate,
  onToggleInbox,
  onToggleFavorite,
  filterTag = null,
}: NoteListPanelProps) {
  const [query, setQuery] = useState("")
  const [menu, setMenu] = useState<{ id: string; x: number; y: number } | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const handleClear = useCallback(() => setQuery(""), [])

  // Copy a shareable deep link to the note to the clipboard.
  const copyNoteLink = useCallback((id: string) => {
    const url = `${window.location.origin}${window.location.pathname}?note=${id}`
    navigator.clipboard?.writeText(url).catch(() => {})
    setCopiedId(id)
    window.setTimeout(() => setCopiedId((c) => (c === id ? null : c)), 1600)
  }, [])

  const confirmNote = confirmId ? notes.find((n) => n.id === confirmId) ?? null : null
  const menuNote = menu ? notes.find((n) => n.id === menu.id) ?? null : null

  // Filter by tag first, then by search query
  const visibleNotes = useMemo(() => {
    let result = notes

    if (filterTag) {
      result = result.filter((n) =>
        n.tags.some((t) => t.label.toLowerCase() === filterTag)
      )
    }

    if (query.trim()) {
      const q = query.trim().toLowerCase()
      result = result.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.preview.toLowerCase().includes(q) ||
          n.tags.some((t) => t.label.toLowerCase().includes(q))
      )
    }

    return result
  }, [notes, filterTag, query])

  const trimmedQuery = query.trim()

  function buildNoteMenuItems(note: Note): ContextMenuItem[] {
    const items: ContextMenuItem[] = [
      { label: "Open note", icon: FileText, onSelect: () => onSelect(note.id) },
    ]
    if (onDuplicate) items.push({ label: "Duplicate note", icon: Copy, onSelect: () => onDuplicate(note.id) })
    if (onToggleInbox) {
      items.push({
        label: note.inInbox ? "Move to Notes" : "Move to Inbox",
        icon: note.inInbox ? FolderInput : Inbox,
        onSelect: () => onToggleInbox(note.id),
      })
    }
    if (onToggleFavorite) {
      items.push({
        label: note.isFavorite ? "Remove from Favorites" : "Add to Favorites",
        icon: Star,
        onSelect: () => onToggleFavorite(note.id),
      })
    }
    items.push({ type: "separator" })
    items.push({
      label: copiedId === note.id ? "Link copied!" : "Copy note link",
      icon: Link2,
      onSelect: () => copyNoteLink(note.id),
    })
    items.push({
      label: "Export as Markdown",
      icon: FileDown,
      onSelect: () => downloadNoteAsMarkdown(note.title, note.content ?? ""),
    })
    if (onDelete) {
      items.push({ type: "separator" })
      items.push({ label: "Delete note", icon: Trash2, danger: true, onSelect: () => setConfirmId(note.id) })
    }
    return items
  }

  return (
    <aside
      aria-label="Note list"
      className="flex flex-col h-full"
      style={{ width: 260, backgroundColor: "#F0EDE8", flexShrink: 0, borderRight: "1px solid #E2DDD5" }}
    >
      {/* Panel header */}
      <div
        className="flex items-center justify-between px-4 pt-5 pb-3"
        style={{ borderBottom: "1px solid #E2DDD5" }}
      >
        <h2 className="font-medium uppercase" style={{ fontSize: 13, color: "#9A9590", letterSpacing: "0.06em" }}>
          {filterTag ? `#${filterTag}` : "Notes"}
        </h2>
        <div className="flex items-center gap-1">
          <button
            aria-label="More options"
            className="icon-btn flex items-center justify-center w-6 h-6 rounded"
            style={{ color: "#9A9590" }}
          >
            <MoreHorizontal size={16} aria-hidden="true" />
          </button>
          <button
            onClick={onNew}
            aria-label="New note"
            className="icon-btn flex items-center justify-center w-6 h-6 rounded"
            style={{ color: "#D97B45" }}
          >
            <Plus size={17} strokeWidth={2.2} aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Search bar */}
      <div
        className="px-3 py-2"
        style={{ borderBottom: "1px solid #E2DDD5" }}
      >
        <div
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg"
          style={{ background: "#E8E4DC" }}
        >
          <Search
            size={13}
            strokeWidth={2}
            style={{ color: "#B8B4AC", flexShrink: 0 }}
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search notes…"
            aria-label="Search notes"
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              fontSize: 13,
              color: "#2C2A27",
              fontFamily: "system-ui, sans-serif",
            }}
          />
          {query && (
            <button
              onClick={handleClear}
              aria-label="Clear search"
              style={{
                background: "none",
                border: "none",
                padding: 0,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                color: "#B8B4AC",
              }}
            >
              <X size={12} strokeWidth={2.5} aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      {/* Note cards */}
      <ul className="flex-1 overflow-y-auto note-list-scroll py-1" role="list">
        {visibleNotes.length === 0 && (
          <li style={{ padding: "24px 16px", textAlign: "center" }}>
            <p style={{ fontSize: 13, color: "#B8B4AC", fontFamily: "system-ui, sans-serif" }}>
              {trimmedQuery
                ? "No notes match your search."
                : "No notes yet."}
            </p>
          </li>
        )}

        {visibleNotes.map((note) => {
          const isActive = note.id === activeId
          return (
            <li key={note.id} role="listitem">
              <button
                onClick={() => onSelect(note.id)}
                onContextMenu={(e) => {
                  e.preventDefault()
                  setMenu({ id: note.id, x: e.clientX, y: e.clientY })
                }}
                aria-current={isActive ? "true" : undefined}
                className="note-card w-full text-left px-4 py-3"
                style={{
                  backgroundColor: isActive ? "#E4E0D9" : "transparent",
                  borderLeft: isActive ? "2px solid #D97B45" : "2px solid transparent",
                }}
              >
                {/* Title */}
                <p
                  className="font-medium truncate flex items-center gap-1.5"
                  style={{ fontSize: 14, color: isActive ? "#1C1B19" : "#2C2A27", marginBottom: 3 }}
                >
                  {note.isFavorite && (
                    <Star
                      size={12}
                      strokeWidth={2}
                      aria-label="Favorite"
                      style={{ color: "#E8A33D", fill: "#E8A33D", flexShrink: 0 }}
                    />
                  )}
                  <span className="truncate">
                    <HighlightText text={note.title} query={trimmedQuery} />
                  </span>
                </p>

                {/* Preview text */}
                <p
                  className="leading-snug"
                  style={{
                    fontSize: 13,
                    color: "#787470",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    marginBottom: 6,
                  }}
                >
                  <HighlightText text={note.preview} query={trimmedQuery} maxLength={120} />
                </p>

                {/* Footer: date + tags */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span style={{ fontSize: 12, color: "#B8B4AC" }}>{note.date}</span>
                  {note.tags.map((tag) => (
                    <span
                      key={tag.label}
                      className={`inline-flex items-center rounded-full px-2 py-0.5 font-medium ${tag.color} ${tag.textColor}`}
                      style={{ fontSize: 10, lineHeight: 1.4 }}
                    >
                      <HighlightText text={tag.label} query={trimmedQuery} />
                    </span>
                  ))}
                </div>
              </button>

              {/* Divider */}
              <div style={{ height: 1, backgroundColor: "#E8E4DC", marginLeft: 16, marginRight: 16 }} />
            </li>
          )
        })}
      </ul>

      {/* Right-click context menu */}
      {menu && menuNote && (
        <ContextMenu
          x={menu.x}
          y={menu.y}
          ariaLabel="Note actions"
          onClose={() => setMenu(null)}
          items={buildNoteMenuItems(menuNote)}
        />
      )}

      {/* Delete confirmation */}
      {confirmNote && onDelete && (
        <div
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setConfirmId(null)
          }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(28,27,25,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Delete note"
            style={{
              width: "100%",
              maxWidth: 360,
              background: "#FAF9F7",
              borderRadius: 12,
              boxShadow: "0 24px 70px rgba(28,27,25,0.4)",
              padding: 22,
            }}
          >
            <p style={{ fontSize: 15, fontWeight: 600, color: "#1C1B19" }}>Delete note?</p>
            <p style={{ fontSize: 13.5, color: "#787470", marginTop: 6, lineHeight: 1.5 }}>
              {'"'}
              {confirmNote.title || "Untitled"}
              {'"'} will be permanently deleted. This can&apos;t be undone.
            </p>
            <div className="flex items-center justify-end gap-2" style={{ marginTop: 18 }}>
              <button
                onClick={() => setConfirmId(null)}
                style={{
                  padding: "8px 14px",
                  fontSize: 13,
                  fontWeight: 500,
                  color: "#5E5A55",
                  background: "#F0EDE8",
                  border: "1px solid #E2DDD5",
                  borderRadius: 7,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDelete(confirmNote.id)
                  setConfirmId(null)
                }}
                className="flex items-center gap-2"
                style={{
                  padding: "8px 14px",
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#FFFFFF",
                  background: "#C0392B",
                  border: "none",
                  borderRadius: 7,
                  cursor: "pointer",
                }}
              >
                <Trash2 size={14} strokeWidth={2} aria-hidden="true" />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}
