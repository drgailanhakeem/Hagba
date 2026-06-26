"use client"

import type { PublicNote } from "@/lib/db"

function formatDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ""
  return d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })
}

export function ShareView({ note }: { note: PublicNote }) {
  const title = note.title.trim() || "Untitled"
  const updated = formatDate(note.updatedAt)

  return (
    <div
      className="min-h-screen w-full overflow-y-auto"
      style={{ background: "#FAF9F7" }}
    >
      {/* Top bar — minimal, no editor chrome */}
      <header
        className="flex items-center justify-between px-6 py-4"
        style={{ borderBottom: "1px solid #EAE6E0" }}
      >
        <div className="flex items-center gap-2">
          <span
            aria-hidden="true"
            style={{
              width: 22,
              height: 22,
              borderRadius: 6,
              background: "#D97B45",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#FFFFFF",
              fontWeight: 700,
              fontSize: 13,
              fontFamily: "system-ui, sans-serif",
            }}
          >
            H
          </span>
          <span
            style={{ fontSize: 14, fontWeight: 600, color: "#1C1B19", fontFamily: "system-ui, sans-serif" }}
          >
            Hagba
          </span>
        </div>
        <span
          className="inline-flex items-center rounded-full px-2.5 py-1"
          style={{
            fontSize: 11,
            fontWeight: 500,
            color: "#787470",
            background: "#F0EDE8",
            border: "1px solid #E2DDD5",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          Read-only
        </span>
      </header>

      {/* Note content */}
      <article className="mx-auto px-6 pt-12 pb-24" style={{ maxWidth: 680 }}>
        <h1
          style={{
            fontFamily: "'iA Writer Quattro S', 'Georgia', 'Times New Roman', serif",
            fontSize: 32,
            fontWeight: 700,
            lineHeight: 1.2,
            color: "#1C1B19",
            marginBottom: 10,
          }}
        >
          {title}
        </h1>

        <div className="flex flex-wrap items-center gap-2" style={{ marginBottom: 28 }}>
          {updated && (
            <span style={{ fontSize: 12.5, color: "#B8B4AC", fontFamily: "system-ui, sans-serif" }}>
              {updated}
            </span>
          )}
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

        {/* Rendered note body — reuses the editor prose styles */}
        <div
          className="bear-editor"
          // Content is sanitized server-side in page.tsx (sanitizeNoteHtml)
          // before it reaches this component.
          dangerouslySetInnerHTML={{ __html: note.content || "<p></p>" }}
        />
      </article>
    </div>
  )
}
