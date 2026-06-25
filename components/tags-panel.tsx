"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Tag } from "lucide-react"
import { colorById, type TagEntry } from "@/lib/tags"

interface TagsPanelProps {
  tags: TagEntry[]
  activeTag: string | null          // lowercase label of selected filter tag
  onSelectTag: (label: string | null) => void
  onRenameTag: (oldLabel: string, newLabel: string) => void
  onDeleteTag: (label: string) => void
}

interface ContextMenu {
  tag: TagEntry
  x: number
  y: number
}

export function TagsPanel({
  tags,
  activeTag,
  onSelectTag,
  onRenameTag,
  onDeleteTag,
}: TagsPanelProps) {
  const [contextMenu, setContextMenu] = useState<ContextMenu | null>(null)
  const [renaming, setRenaming] = useState<string | null>(null) // label being renamed
  const [renameValue, setRenameValue] = useState("")
  const renameRef = useRef<HTMLInputElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close context menu on outside click
  useEffect(() => {
    if (!contextMenu) return
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setContextMenu(null)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [contextMenu])

  // Focus rename input when it appears
  useEffect(() => {
    if (renaming && renameRef.current) {
      renameRef.current.focus()
      renameRef.current.select()
    }
  }, [renaming])

  const handleContextMenu = useCallback((e: React.MouseEvent, tag: TagEntry) => {
    e.preventDefault()
    setContextMenu({ tag, x: e.clientX, y: e.clientY })
  }, [])

  const startRename = useCallback((tag: TagEntry) => {
    setContextMenu(null)
    setRenaming(tag.label)
    setRenameValue(tag.displayLabel)
  }, [])

  const commitRename = useCallback(() => {
    if (!renaming) return
    const trimmed = renameValue.trim().replace(/^#+/, "")
    if (trimmed && trimmed.toLowerCase() !== renaming) {
      onRenameTag(renaming, trimmed)
    }
    setRenaming(null)
    setRenameValue("")
  }, [renaming, renameValue, onRenameTag])

  const handleDeleteTag = useCallback((label: string) => {
    setContextMenu(null)
    onDeleteTag(label)
    if (activeTag === label) onSelectTag(null)
  }, [activeTag, onDeleteTag, onSelectTag])

  const sortedTags = [...tags].sort((a, b) => b.noteCount - a.noteCount)

  return (
    <aside
      aria-label="Tags"
      className="flex flex-col h-full"
      style={{
        width: 260,
        backgroundColor: "#F0EDE8",
        flexShrink: 0,
        borderRight: "1px solid #E2DDD5",
      }}
    >
      {/* Panel header */}
      <div
        className="flex items-center justify-between px-4 pt-5 pb-3"
        style={{ borderBottom: "1px solid #E2DDD5" }}
      >
        <h2
          className="font-medium tracking-wide uppercase"
          style={{ fontSize: 13, color: "#9A9590", letterSpacing: "0.06em" }}
        >
          Tags
        </h2>
        <span style={{ fontSize: 12, color: "#B8B4AC" }}>
          {tags.length} {tags.length === 1 ? "tag" : "tags"}
        </span>
      </div>

      {/* "All notes" row */}
      <div className="px-2 pt-2">
        <button
          onClick={() => onSelectTag(null)}
          aria-pressed={activeTag === null}
          className="icon-btn w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-lg"
          style={{
            background: activeTag === null ? "#E4E0D9" : "transparent",
            fontSize: 13,
            color: activeTag === null ? "#1C1B19" : "#2C2A27",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          <Tag size={14} strokeWidth={1.75} style={{ color: "#9A9590", flexShrink: 0 }} aria-hidden="true" />
          <span style={{ fontWeight: activeTag === null ? 500 : 400 }}>All notes</span>
        </button>
      </div>

      {/* Tag list */}
      <ul
        className="flex-1 overflow-y-auto note-list-scroll px-2 pb-4 mt-1"
        role="list"
        aria-label="Tag list"
      >
        {sortedTags.length === 0 && (
          <li className="px-3 py-6 text-center">
            <p style={{ fontSize: 13, color: "#B8B4AC", fontFamily: "system-ui, sans-serif" }}>
              No tags yet. Type{" "}
              <kbd
                style={{
                  background: "#EDE9E2",
                  border: "1px solid #D8D4CC",
                  borderRadius: 3,
                  padding: "0 4px",
                  fontSize: 11,
                  color: "#787470",
                }}
              >
                #
              </kbd>{" "}
              in the editor to create one.
            </p>
          </li>
        )}

        {sortedTags.map((tag) => {
          const color = colorById(tag.colorId)
          const isActive = activeTag === tag.label

          return (
            <li key={tag.label} role="listitem">
              {renaming === tag.label ? (
                /* Inline rename input */
                <div className="flex items-center gap-2 px-3 py-1.5">
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      backgroundColor: color.dot,
                      flexShrink: 0,
                    }}
                    aria-hidden="true"
                  />
                  <input
                    ref={renameRef}
                    type="text"
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onBlur={commitRename}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commitRename()
                      if (e.key === "Escape") { setRenaming(null); setRenameValue("") }
                    }}
                    aria-label={`Rename tag ${tag.displayLabel}`}
                    style={{
                      flex: 1,
                      fontSize: 13,
                      color: "#1C1B19",
                      background: "#EDE9E2",
                      border: "1px solid #D97B45",
                      borderRadius: 5,
                      padding: "2px 6px",
                      fontFamily: "system-ui, sans-serif",
                      outline: "none",
                    }}
                  />
                </div>
              ) : (
                <button
                  onClick={() => onSelectTag(isActive ? null : tag.label)}
                  onContextMenu={(e) => handleContextMenu(e, tag)}
                  aria-pressed={isActive}
                  className="icon-btn w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-lg"
                  style={{
                    background: isActive ? "#E4E0D9" : "transparent",
                    fontFamily: "system-ui, sans-serif",
                  }}
                >
                  {/* Color dot */}
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      backgroundColor: color.dot,
                      flexShrink: 0,
                    }}
                    aria-hidden="true"
                  />

                  {/* Tag label */}
                  <span
                    style={{
                      flex: 1,
                      fontSize: 13,
                      color: isActive ? "#1C1B19" : "#2C2A27",
                      fontWeight: isActive ? 500 : 400,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {tag.displayLabel}
                  </span>

                  {/* Note count badge */}
                  <span
                    style={{
                      fontSize: 11,
                      color: "#B8B4AC",
                      minWidth: 16,
                      textAlign: "right",
                    }}
                  >
                    {tag.noteCount}
                  </span>
                </button>
              )}
            </li>
          )
        })}
      </ul>

      {/* Right-click context menu */}
      {contextMenu && (
        <div
          ref={menuRef}
          role="menu"
          aria-label={`Tag options for ${contextMenu.tag.displayLabel}`}
          style={{
            position: "fixed",
            left: contextMenu.x,
            top: contextMenu.y,
            zIndex: 9999,
            background: "#FFFEFA",
            border: "1px solid #E2DDD5",
            borderRadius: 9,
            boxShadow: "0 6px 24px rgba(28,27,25,0.14), 0 1px 4px rgba(28,27,25,0.07)",
            padding: "4px",
            minWidth: 160,
          }}
        >
          <button
            role="menuitem"
            onClick={() => startRename(contextMenu.tag)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              width: "100%",
              padding: "7px 12px",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              textAlign: "left",
              fontSize: 13,
              color: "#1C1B19",
              fontFamily: "system-ui, sans-serif",
              borderRadius: 6,
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#F3EFE8" }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent" }}
          >
            Rename
          </button>
          <div style={{ height: 1, background: "#EDE9E2", margin: "2px 0" }} />
          <button
            role="menuitem"
            onClick={() => handleDeleteTag(contextMenu.tag.label)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              width: "100%",
              padding: "7px 12px",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              textAlign: "left",
              fontSize: 13,
              color: "#C0392B",
              fontFamily: "system-ui, sans-serif",
              borderRadius: 6,
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#FEF2F2" }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent" }}
          >
            Delete tag
          </button>
        </div>
      )}
    </aside>
  )
}
