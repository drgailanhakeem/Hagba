"use client"

import { useState } from "react"
import { FolderOpen, Trash2 } from "lucide-react"
import type { Note } from "./note-list-panel"

interface InboxViewProps {
  notes: Note[]
  onMoveToNotes: (id: string) => void
  onDelete: (id: string) => void
  onOpen: (id: string) => void
}

export function InboxView({ notes, onMoveToNotes, onDelete, onOpen }: InboxViewProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [exitingId, setExitingId] = useState<string | null>(null)

  function handleMove(id: string) {
    setExitingId(id)
    setTimeout(() => {
      onMoveToNotes(id)
      setExitingId(null)
    }, 220)
  }

  function handleDelete(id: string) {
    setExitingId(id)
    setTimeout(() => {
      onDelete(id)
      setExitingId(null)
    }, 220)
  }

  return (
    <aside
      aria-label="Inbox"
      className="flex flex-col h-full"
      style={{
        width: 260,
        backgroundColor: "#F0EDE8",
        flexShrink: 0,
        borderRight: "1px solid #E2DDD5",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 pt-5 pb-3"
        style={{ borderBottom: "1px solid #E2DDD5" }}
      >
        <h2
          className="font-medium uppercase tracking-wide"
          style={{ fontSize: 13, color: "#9A9590", letterSpacing: "0.06em" }}
        >
          Inbox
        </h2>
        {notes.length > 0 && (
          <span
            style={{
              fontSize: 11,
              color: "#9A9590",
              fontFamily: "system-ui, sans-serif",
            }}
          >
            {notes.length} {notes.length === 1 ? "note" : "notes"}
          </span>
        )}
      </div>

      {/* Empty state */}
      {notes.length === 0 && (
        <div
          className="flex flex-col items-center justify-center flex-1"
          style={{ padding: "0 24px", textAlign: "center" }}
        >
          {/* Checkmark illustration */}
          <div
            aria-hidden="true"
            style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              backgroundColor: "#E8F5EE",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 14,
            }}
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#3DAA6E"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <p
            className="font-medium"
            style={{ fontSize: 14, color: "#2C2A27", marginBottom: 5 }}
          >
            All clear.
          </p>
          <p style={{ fontSize: 13, color: "#9A9590", lineHeight: 1.5 }}>
            Nothing waiting. Press{" "}
            <kbd
              style={{
                background: "#EDE9E2",
                border: "1px solid #D8D4CC",
                borderRadius: 3,
                padding: "0 4px",
                fontSize: 10,
                color: "#787470",
                fontFamily: "system-ui, sans-serif",
              }}
            >
              ⌘K
            </kbd>{" "}
            to capture a thought.
          </p>
        </div>
      )}

      {/* Inbox cards */}
      {notes.length > 0 && (
        <ul className="flex-1 overflow-y-auto note-list-scroll py-1" role="list">
          {notes.map((note) => {
            const isHovered = hoveredId === note.id
            const isExiting = exitingId === note.id

            return (
              <li
                key={note.id}
                role="listitem"
                style={{
                  opacity: isExiting ? 0 : 1,
                  transform: isExiting ? "translateX(-8px)" : "translateX(0)",
                  transition: isExiting ? "opacity 0.2s ease, transform 0.2s ease" : "none",
                }}
              >
                <div
                  onMouseEnter={() => setHoveredId(note.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  style={{
                    position: "relative",
                    padding: "11px 14px",
                    /* Soft yellow-tinted inbox card */
                    backgroundColor: isHovered ? "#F5EFD6" : "#FBF5DE",
                    borderLeft: "2px solid #E8C84A",
                    margin: "3px 8px",
                    borderRadius: 8,
                    cursor: "pointer",
                    transition: "background-color 0.12s ease",
                  }}
                >
                  {/* Click to open */}
                  <button
                    onClick={() => onOpen(note.id)}
                    aria-label={`Open note: ${note.title}`}
                    style={{
                      display: "block",
                      width: "100%",
                      textAlign: "left",
                      background: "none",
                      border: "none",
                      padding: 0,
                      cursor: "pointer",
                    }}
                  >
                    {/* Title */}
                    <p
                      className="font-medium truncate"
                      style={{ fontSize: 14, color: "#1C1B19", marginBottom: 3 }}
                    >
                      {note.title}
                    </p>

                    {/* Preview */}
                    {note.preview && (
                      <p
                        style={{
                          fontSize: 13,
                          color: "#787470",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                          marginBottom: 6,
                          lineHeight: 1.45,
                        }}
                      >
                        {note.preview}
                      </p>
                    )}

                    {/* Footer: date + tags */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span style={{ fontSize: 12, color: "#B8A840" }}>{note.date}</span>
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

                  {/* Hover action buttons */}
                  {isHovered && (
                    <div
                      style={{
                        position: "absolute",
                        bottom: 9,
                        right: 10,
                        display: "flex",
                        gap: 4,
                        animation: "fadeIn 0.1s ease",
                      }}
                    >
                      {/* Move to Notes */}
                      <button
                        onClick={(e) => { e.stopPropagation(); handleMove(note.id) }}
                        aria-label="Move to Notes"
                        title="Move to Notes"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                          padding: "3px 8px",
                          borderRadius: 6,
                          border: "1px solid #D8C86A",
                          backgroundColor: "#FDF4BD",
                          cursor: "pointer",
                          fontSize: 11,
                          fontFamily: "system-ui, sans-serif",
                          fontWeight: 500,
                          color: "#8A7820",
                          transition: "background-color 0.1s",
                          whiteSpace: "nowrap",
                        }}
                      >
                        <FolderOpen size={11} strokeWidth={2} aria-hidden="true" />
                        Move to Notes
                      </button>

                      {/* Delete */}
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(note.id) }}
                        aria-label="Delete note"
                        title="Delete note"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: 26,
                          height: 26,
                          borderRadius: 6,
                          border: "1px solid #E8D8D5",
                          backgroundColor: "#FDF2EF",
                          cursor: "pointer",
                          color: "#C0584A",
                          transition: "background-color 0.1s",
                        }}
                      >
                        <Trash2 size={11} strokeWidth={2} aria-hidden="true" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Subtle divider */}
                <div style={{ height: 1, backgroundColor: "transparent", margin: "0 8px" }} />
              </li>
            )
          })}
        </ul>
      )}
    </aside>
  )
}
