"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import {
  Tag,
  Share2,
  MoreHorizontal,
  Plus,
  Check,
  Copy,
  FileDown,
  Printer,
  Inbox,
  FolderInput,
  Star,
  Trash2,
  Link2,
  Globe,
  Lock,
} from "lucide-react"
import type { Note } from "../note-list-panel"
import type { TagEntry } from "@/lib/tags"
import { colorById } from "@/lib/tags"
import { downloadNoteAsMarkdown } from "@/lib/export-markdown"

interface EditorToolbarProps {
  note: Note
  existingTags: TagEntry[]
  onToggleTag: (noteId: string, label: string) => void
  onCreateTag: (label: string) => void
  onDuplicate: (id: string) => void
  onToggleInbox: (id: string) => void
  onToggleFavorite: (id: string) => void
  onDelete: (id: string) => void
  onSetPublic: (id: string, isPublic: boolean) => void
}

type OpenPanel = "tags" | "share" | "more" | null

const POPOVER_STYLE: React.CSSProperties = {
  position: "absolute",
  top: "calc(100% + 8px)",
  right: 0,
  zIndex: 1000,
  background: "#FFFFFF",
  border: "1px solid #E2DDD5",
  borderRadius: 10,
  boxShadow: "0 12px 36px rgba(28,27,25,0.16)",
  fontFamily: "system-ui, sans-serif",
}

export function EditorToolbar({
  note,
  existingTags,
  onToggleTag,
  onCreateTag,
  onDuplicate,
  onToggleInbox,
  onToggleFavorite,
  onDelete,
  onSetPublic,
}: EditorToolbarProps) {
  const [open, setOpen] = useState<OpenPanel>(null)
  const [tagQuery, setTagQuery] = useState("")
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [copied, setCopied] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const tagInputRef = useRef<HTMLInputElement>(null)

  // Close any open panel on outside click / Escape
  useEffect(() => {
    if (!open) return
    function onDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(null)
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(null)
    }
    const id = setTimeout(() => {
      document.addEventListener("mousedown", onDown)
      document.addEventListener("keydown", onKey)
    }, 0)
    return () => {
      clearTimeout(id)
      document.removeEventListener("mousedown", onDown)
      document.removeEventListener("keydown", onKey)
    }
  }, [open])

  // Focus the tag input when the tag dropdown opens
  useEffect(() => {
    if (open === "tags") {
      setTagQuery("")
      const id = setTimeout(() => tagInputRef.current?.focus(), 20)
      return () => clearTimeout(id)
    }
  }, [open])

  const appliedLabels = new Set(note.tags.map((t) => t.label.toLowerCase()))

  const filteredTags = existingTags.filter((t) =>
    t.displayLabel.toLowerCase().includes(tagQuery.trim().toLowerCase()),
  )
  const trimmedQuery = tagQuery.trim()
  const queryExists = existingTags.some(
    (t) => t.displayLabel.toLowerCase() === trimmedQuery.toLowerCase(),
  )

  const handleCreateTag = useCallback(() => {
    const label = tagQuery.trim()
    if (!label) return
    onCreateTag(label)
    setTagQuery("")
    tagInputRef.current?.focus()
  }, [tagQuery, onCreateTag])

  const shareUrl =
    typeof window !== "undefined" ? `${window.location.origin}/share/${note.id}` : `/share/${note.id}`

  const copyShareLink = useCallback(() => {
    navigator.clipboard?.writeText(shareUrl).catch(() => {})
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }, [shareUrl])

  const iconBtn = (active: boolean): React.CSSProperties => ({
    color: active ? "#D97B45" : "#9A9590",
    background: active ? "#FBEFE7" : "transparent",
  })

  return (
    <div ref={containerRef} className="editor-toolbar-actions flex items-center gap-1" style={{ position: "relative" }}>
      {/* ── Tag button ── */}
      <div style={{ position: "relative" }}>
        <button
          aria-label="Add tag"
          aria-haspopup="true"
          aria-expanded={open === "tags"}
          onClick={() => setOpen((p) => (p === "tags" ? null : "tags"))}
          className="icon-btn flex items-center justify-center w-7 h-7 rounded-lg"
          style={iconBtn(open === "tags" || note.tags.length > 0)}
        >
          <Tag size={15} strokeWidth={1.75} aria-hidden="true" />
        </button>

        {open === "tags" && (
          <div role="dialog" aria-label="Manage tags" style={{ ...POPOVER_STYLE, width: 240, padding: 8 }}>
            <div
              className="flex items-center gap-2 px-2 mb-2 rounded-lg"
              style={{ background: "#F3EFE8", padding: "6px 8px" }}
            >
              <input
                ref={tagInputRef}
                value={tagQuery}
                onChange={(e) => setTagQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && trimmedQuery && !queryExists) {
                    e.preventDefault()
                    handleCreateTag()
                  }
                }}
                placeholder="Search or create tag…"
                aria-label="Search or create tag"
                style={{
                  flex: 1,
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  fontSize: 13,
                  color: "#2C2A27",
                }}
              />
            </div>

            <div style={{ maxHeight: 220, overflowY: "auto" }}>
              {/* Create option */}
              {trimmedQuery && !queryExists && (
                <button
                  onClick={handleCreateTag}
                  className="flex items-center gap-2 w-full text-left rounded-md"
                  style={{ padding: "7px 8px", fontSize: 13, color: "#D97B45", cursor: "pointer", background: "transparent" }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "#FBEFE7")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
                >
                  <Plus size={14} strokeWidth={2} aria-hidden="true" />
                  Create {'"'}{trimmedQuery}{'"'}
                </button>
              )}

              {filteredTags.length === 0 && !trimmedQuery && (
                <p style={{ padding: "8px", fontSize: 12.5, color: "#B8B4AC" }}>No tags yet. Type to create one.</p>
              )}

              {filteredTags.map((tag) => {
                const checked = appliedLabels.has(tag.label)
                const color = colorById(tag.colorId)
                return (
                  <button
                    key={tag.label}
                    role="menuitemcheckbox"
                    aria-checked={checked}
                    onClick={() => onToggleTag(note.id, tag.displayLabel)}
                    className="flex items-center gap-2.5 w-full text-left rounded-md"
                    style={{ padding: "7px 8px", fontSize: 13, color: "#2C2A27", cursor: "pointer", background: "transparent" }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "#F3EFE8")}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
                  >
                    <span
                      aria-hidden="true"
                      className="flex items-center justify-center rounded"
                      style={{
                        width: 16,
                        height: 16,
                        flexShrink: 0,
                        border: checked ? "none" : "1.5px solid #CFC9C0",
                        background: checked ? "#D97B45" : "transparent",
                      }}
                    >
                      {checked && <Check size={11} strokeWidth={3} color="#FFFFFF" />}
                    </span>
                    <span
                      aria-hidden="true"
                      style={{ width: 8, height: 8, borderRadius: "50%", background: color.dot, flexShrink: 0 }}
                    />
                    <span className="truncate">{tag.displayLabel}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Share button ── */}
      <div style={{ position: "relative" }}>
        <button
          aria-label="Share note"
          aria-haspopup="true"
          aria-expanded={open === "share"}
          onClick={() => setOpen((p) => (p === "share" ? null : "share"))}
          className="icon-btn flex items-center justify-center w-7 h-7 rounded-lg"
          style={iconBtn(open === "share" || !!note.isPublic)}
        >
          <Share2 size={15} strokeWidth={1.75} aria-hidden="true" />
        </button>

        {open === "share" && (
          <div role="dialog" aria-label="Share note" style={{ ...POPOVER_STYLE, width: 280, padding: 14 }}>
            <div className="flex items-center gap-2" style={{ marginBottom: 8 }}>
              {note.isPublic ? (
                <Globe size={15} strokeWidth={2} color="#4CAF82" aria-hidden="true" />
              ) : (
                <Lock size={15} strokeWidth={2} color="#9A9590" aria-hidden="true" />
              )}
              <span style={{ fontSize: 13.5, fontWeight: 600, color: "#1C1B19" }}>
                {note.isPublic ? "Public note" : "Share note"}
              </span>
            </div>

            <p style={{ fontSize: 12.5, color: "#787470", lineHeight: 1.5, marginBottom: 12 }}>
              {note.isPublic
                ? "Anyone with the link can view this note in read-only mode."
                : "Create a public read-only link that anyone can open."}
            </p>

            {note.isPublic ? (
              <>
                <div
                  className="flex items-center gap-2 rounded-lg"
                  style={{ background: "#F3EFE8", padding: "7px 10px", marginBottom: 10 }}
                >
                  <Link2 size={13} strokeWidth={2} color="#9A9590" aria-hidden="true" style={{ flexShrink: 0 }} />
                  <span
                    className="truncate"
                    style={{ fontSize: 12, color: "#5E5A55", fontFamily: "'Geist Mono', monospace" }}
                  >
                    {shareUrl.replace(/^https?:\/\//, "")}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={copyShareLink}
                    className="flex items-center justify-center gap-2 flex-1 rounded-lg"
                    style={{
                      padding: "8px 12px",
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#FFFFFF",
                      background: "#D97B45",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    {copied ? <Check size={14} strokeWidth={2.5} /> : <Link2 size={14} strokeWidth={2} />}
                    {copied ? "Copied!" : "Copy link"}
                  </button>
                  <button
                    onClick={() => onSetPublic(note.id, false)}
                    className="flex items-center justify-center gap-2 rounded-lg"
                    style={{
                      padding: "8px 12px",
                      fontSize: 13,
                      fontWeight: 500,
                      color: "#5E5A55",
                      background: "#F0EDE8",
                      border: "1px solid #E2DDD5",
                      cursor: "pointer",
                    }}
                  >
                    Unshare
                  </button>
                </div>
              </>
            ) : (
              <button
                onClick={() => onSetPublic(note.id, true)}
                className="flex items-center justify-center gap-2 w-full rounded-lg"
                style={{
                  padding: "9px 12px",
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#FFFFFF",
                  background: "#D97B45",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                <Globe size={14} strokeWidth={2} aria-hidden="true" />
                Create public link
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── More options ── */}
      <div style={{ position: "relative" }}>
        <button
          aria-label="More options"
          aria-haspopup="true"
          aria-expanded={open === "more"}
          onClick={() => setOpen((p) => (p === "more" ? null : "more"))}
          className="icon-btn flex items-center justify-center w-7 h-7 rounded-lg"
          style={iconBtn(open === "more")}
        >
          <MoreHorizontal size={16} strokeWidth={1.75} aria-hidden="true" />
        </button>

        {open === "more" && (
          <div role="menu" aria-label="Note actions" style={{ ...POPOVER_STYLE, width: 210, padding: 4 }}>
            <MenuItem icon={Copy} label="Duplicate note" onClick={() => { onDuplicate(note.id); setOpen(null) }} />
            <MenuItem
              icon={FileDown}
              label="Export as Markdown"
              onClick={() => { downloadNoteAsMarkdown(note.title, note.content ?? ""); setOpen(null) }}
            />
            <MenuItem
              icon={Printer}
              label="Export as PDF"
              onClick={() => { setOpen(null); setTimeout(() => window.print(), 60) }}
            />
            <Divider />
            <MenuItem
              icon={note.inInbox ? FolderInput : Inbox}
              label={note.inInbox ? "Move to Notes" : "Move to Inbox"}
              onClick={() => { onToggleInbox(note.id); setOpen(null) }}
            />
            <MenuItem
              icon={Star}
              label={note.isFavorite ? "Remove from Favorites" : "Add to Favorites"}
              onClick={() => { onToggleFavorite(note.id); setOpen(null) }}
            />
            <Divider />
            <MenuItem
              icon={Trash2}
              label="Delete note"
              danger
              onClick={() => { setOpen(null); setConfirmDelete(true) }}
            />
          </div>
        )}
      </div>

      {/* Delete confirmation */}
      {confirmDelete && (
        <div
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setConfirmDelete(false)
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
              {note.title || "Untitled"}
              {'"'} will be permanently deleted. This can&apos;t be undone.
            </p>
            <div className="flex items-center justify-end gap-2" style={{ marginTop: 18 }}>
              <button
                onClick={() => setConfirmDelete(false)}
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
                onClick={() => { onDelete(note.id); setConfirmDelete(false) }}
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
    </div>
  )
}

function MenuItem({
  icon: Icon,
  label,
  onClick,
  danger = false,
}: {
  icon: typeof Copy
  label: string
  onClick: () => void
  danger?: boolean
}) {
  return (
    <button
      role="menuitem"
      onClick={onClick}
      className="flex items-center gap-2.5 w-full text-left rounded-md"
      style={{
        padding: "7px 10px",
        fontSize: 13,
        color: danger ? "#C0392B" : "#2C2A27",
        background: "transparent",
        cursor: "pointer",
      }}
      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = danger ? "#FBECEA" : "#F3EFE8")}
      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
    >
      <Icon size={14} strokeWidth={2} aria-hidden="true" />
      {label}
    </button>
  )
}

function Divider() {
  return <div style={{ height: 1, background: "#EDE9E2", margin: "4px 0" }} aria-hidden="true" />
}
