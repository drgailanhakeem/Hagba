"use client"

import { MoreHorizontal, Plus } from "lucide-react"

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
}

interface NoteListPanelProps {
  notes: Note[]
  activeId: string
  onSelect: (id: string) => void
  onNew: () => void
}

export function NoteListPanel({ notes, activeId, onSelect, onNew }: NoteListPanelProps) {
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
        <h2 className="font-medium text-[13px] tracking-wide uppercase" style={{ color: "#9A9590", letterSpacing: "0.06em" }}>
          Notes
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

      {/* Note cards */}
      <ul className="flex-1 overflow-y-auto note-list-scroll py-1" role="list">
        {notes.map((note) => {
          const isActive = note.id === activeId
          return (
            <li key={note.id} role="listitem">
              <button
                onClick={() => onSelect(note.id)}
                aria-current={isActive ? "true" : undefined}
                className="note-card w-full text-left px-4 py-3"
                style={{
                  backgroundColor: isActive ? "#E4E0D9" : "transparent",
                  borderLeft: isActive ? "2px solid #D97B45" : "2px solid transparent",
                }}
              >
                {/* Title */}
                <p
                  className="font-medium truncate"
                  style={{ fontSize: 14, color: isActive ? "#1C1B19" : "#2C2A27", marginBottom: 3 }}
                >
                  {note.title}
                </p>

                {/* Preview text — 2 lines max */}
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
                  {note.preview}
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
                      {tag.label}
                    </span>
                  ))}
                </div>
              </button>

              {/* Subtle divider between cards */}
              <div style={{ height: 1, backgroundColor: "#E8E4DC", marginLeft: 16, marginRight: 16 }} />
            </li>
          )
        })}
      </ul>
    </aside>
  )
}
