"use client"

import { useEffect, useRef, useState } from "react"
import {
  Inbox,
  Star,
  CalendarDays,
  Layers,
  Archive,
  Circle,
  Plus,
  Pencil,
  Smile,
  Trash2,
} from "lucide-react"
import type { SectionId, Task, Project } from "@/lib/todos"
import { countSection } from "@/lib/todos"
import { ContextMenu } from "@/components/context-menu"

type TodoSelection =
  | { kind: "section"; id: SectionId }
  | { kind: "project"; id: string }

interface TodoNavPanelProps {
  tasks: Task[]
  projects: Project[]
  selection: TodoSelection
  onSelect: (sel: TodoSelection) => void
  onNewProject: () => void
  onRenameProject?: (id: string, name: string) => void
  onChangeProjectEmoji?: (id: string, emoji: string) => void
  onDeleteProject?: (id: string) => void
}

const SECTIONS: {
  id: SectionId
  label: string
  icon: typeof Inbox
  color: string
}[] = [
  { id: "inbox",    label: "Inbox",    icon: Inbox,        color: "#5E6AD2" },
  { id: "today",    label: "Today",    icon: Star,         color: "#F5C518" },
  { id: "upcoming", label: "Upcoming", icon: CalendarDays, color: "#E0533D" },
  { id: "anytime",  label: "Anytime",  icon: Layers,       color: "#37C2C4" },
  { id: "someday",  label: "Someday",  icon: Archive,      color: "#C8A45C" },
]

const EMOJI_CHOICES = [
  "📁", "🚀", "📌", "🎯", "💡", "🌱", "📦", "⭐",
  "🎨", "✈️", "🏠", "💼", "📚", "🏃", "🍳", "🎸",
  "💪", "🧪", "🛠️", "🌍", "❤️", "🔥", "🎉", "🧠",
]

export function TodoNavPanel({
  tasks,
  projects,
  selection,
  onSelect,
  onNewProject,
  onRenameProject,
  onChangeProjectEmoji,
  onDeleteProject,
}: TodoNavPanelProps) {
  const [menu, setMenu] = useState<{ id: string; x: number; y: number } | null>(null)
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState("")
  const [emojiFor, setEmojiFor] = useState<{ id: string; x: number; y: number } | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const renameRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (renamingId && renameRef.current) {
      renameRef.current.focus()
      renameRef.current.select()
    }
  }, [renamingId])

  // Close the emoji picker on outside click / escape
  useEffect(() => {
    if (!emojiFor) return
    function close() { setEmojiFor(null) }
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") setEmojiFor(null) }
    const id = setTimeout(() => {
      window.addEventListener("mousedown", close)
      window.addEventListener("keydown", onKey)
    }, 0)
    return () => {
      clearTimeout(id)
      window.removeEventListener("mousedown", close)
      window.removeEventListener("keydown", onKey)
    }
  }, [emojiFor])

  function startRename(p: Project) {
    setRenamingId(p.id)
    setRenameValue(p.name)
  }

  function commitRename() {
    if (!renamingId) return
    const trimmed = renameValue.trim()
    const proj = projects.find((p) => p.id === renamingId)
    if (trimmed && proj && trimmed !== proj.name) onRenameProject?.(renamingId, trimmed)
    setRenamingId(null)
    setRenameValue("")
  }

  const confirmProject = confirmDeleteId ? projects.find((p) => p.id === confirmDeleteId) ?? null : null

  return (
    <aside
      aria-label="To-do navigation"
      className="flex flex-col h-full"
      style={{
        width: 260,
        backgroundColor: "#FBFBFD",
        borderRight: "1px solid #ECECEF",
        flexShrink: 0,
      }}
    >
      <div className="flex-1 overflow-y-auto px-3 pt-5 pb-4">
        {/* Built-in sections */}
        <nav className="flex flex-col gap-0.5">
          {SECTIONS.map(({ id, label, icon: Icon, color }) => {
            const isActive = selection.kind === "section" && selection.id === id
            const count = countSection(tasks, id)
            return (
              <button
                key={id}
                onClick={() => onSelect({ kind: "section", id })}
                aria-current={isActive ? "true" : undefined}
                className="todo-nav-row flex items-center gap-2.5 rounded-md text-left"
                style={{
                  height: 34,
                  padding: "0 8px",
                  backgroundColor: isActive ? "#E6E8FB" : "transparent",
                }}
              >
                <Icon
                  size={17}
                  strokeWidth={2}
                  style={{ color, flexShrink: 0 }}
                  aria-hidden="true"
                  fill={id === "today" ? color : "none"}
                />
                <span
                  className="flex-1 truncate"
                  style={{
                    fontSize: 14,
                    fontWeight: isActive ? 600 : 500,
                    color: "#1D1D1F",
                  }}
                >
                  {label}
                </span>
                {count > 0 && (
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 500,
                      color: isActive ? "#5E6AD2" : "#A1A1AA",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        {/* Divider */}
        <div style={{ height: 1, background: "#ECECEF", margin: "14px 8px" }} aria-hidden="true" />

        {/* Projects */}
        <div className="flex items-center justify-between px-2 mb-1.5">
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.05em", color: "#A1A1AA", textTransform: "uppercase" }}>
            Projects
          </span>
        </div>

        <nav className="flex flex-col gap-0.5">
          {projects.map((proj) => {
            const isActive = selection.kind === "project" && selection.id === proj.id
            const openCount = tasks.filter((t) => !t.done && t.projectId === proj.id).length

            if (renamingId === proj.id) {
              return (
                <div key={proj.id} className="flex items-center gap-2.5" style={{ height: 34, padding: "0 8px" }}>
                  <span style={{ width: 17, textAlign: "center", flexShrink: 0, fontSize: 14, lineHeight: 1 }} aria-hidden="true">
                    {proj.emoji || "•"}
                  </span>
                  <input
                    ref={renameRef}
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onBlur={commitRename}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commitRename()
                      if (e.key === "Escape") { setRenamingId(null); setRenameValue("") }
                    }}
                    aria-label={`Rename project ${proj.name}`}
                    className="flex-1"
                    style={{
                      fontSize: 14,
                      fontWeight: 500,
                      color: "#1D1D1F",
                      background: "#FFFFFF",
                      border: "1px solid #5E6AD2",
                      borderRadius: 5,
                      padding: "2px 6px",
                      outline: "none",
                      minWidth: 0,
                    }}
                  />
                </div>
              )
            }

            return (
              <button
                key={proj.id}
                onClick={() => onSelect({ kind: "project", id: proj.id })}
                onContextMenu={(e) => {
                  e.preventDefault()
                  setMenu({ id: proj.id, x: e.clientX, y: e.clientY })
                }}
                aria-current={isActive ? "true" : undefined}
                className="todo-nav-row flex items-center gap-2.5 rounded-md text-left"
                style={{
                  height: 34,
                  padding: "0 8px",
                  backgroundColor: isActive ? "#E6E8FB" : "transparent",
                }}
              >
                <span style={{ width: 17, textAlign: "center", flexShrink: 0, fontSize: 14, lineHeight: 1 }} aria-hidden="true">
                  {proj.emoji || <Circle size={13} style={{ color: "#5E6AD2", display: "inline" }} />}
                </span>
                <span
                  className="flex-1 truncate"
                  style={{
                    fontSize: 14,
                    fontWeight: isActive ? 600 : 500,
                    color: "#1D1D1F",
                  }}
                >
                  {proj.name}
                </span>
                {openCount > 0 && (
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 500,
                      color: isActive ? "#5E6AD2" : "#A1A1AA",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {openCount}
                  </span>
                )}
              </button>
            )
          })}
        </nav>
      </div>

      {/* New Project button */}
      <div style={{ borderTop: "1px solid #ECECEF", padding: 8 }}>
        <button
          onClick={onNewProject}
          className="todo-nav-row flex items-center gap-2 rounded-md w-full"
          style={{ height: 34, padding: "0 8px", color: "#6B6B70" }}
        >
          <Plus size={16} strokeWidth={2.2} aria-hidden="true" />
          <span style={{ fontSize: 13.5, fontWeight: 500 }}>New Project</span>
        </button>
      </div>

      {/* Project context menu */}
      {menu && (
        <ContextMenu
          x={menu.x}
          y={menu.y}
          ariaLabel="Project actions"
          onClose={() => setMenu(null)}
          items={[
            {
              label: "Rename project",
              icon: Pencil,
              onSelect: () => {
                const p = projects.find((x) => x.id === menu.id)
                if (p) startRename(p)
              },
            },
            {
              label: "Change emoji",
              icon: Smile,
              onSelect: () => setEmojiFor({ id: menu.id, x: menu.x, y: menu.y }),
            },
            { type: "separator" },
            {
              label: "Delete project",
              icon: Trash2,
              danger: true,
              onSelect: () => setConfirmDeleteId(menu.id),
            },
          ]}
        />
      )}

      {/* Emoji picker */}
      {emojiFor && (
        <div
          role="dialog"
          aria-label="Choose an emoji"
          onMouseDown={(e) => e.stopPropagation()}
          style={{
            position: "fixed",
            left: Math.min(emojiFor.x, window.innerWidth - 240),
            top: Math.min(emojiFor.y, window.innerHeight - 200),
            zIndex: 9999,
            background: "#FFFFFF",
            border: "1px solid #E2E2E6",
            borderRadius: 12,
            boxShadow: "0 12px 36px rgba(0,0,0,0.16)",
            padding: 10,
            width: 232,
          }}
        >
          <div className="grid grid-cols-8 gap-1">
            {EMOJI_CHOICES.map((emoji) => (
              <button
                key={emoji}
                onClick={() => {
                  onChangeProjectEmoji?.(emojiFor.id, emoji)
                  setEmojiFor(null)
                }}
                aria-label={`Set emoji ${emoji}`}
                className="flex items-center justify-center rounded-md"
                style={{ width: 26, height: 26, fontSize: 17, background: "transparent", cursor: "pointer" }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "#F0F0F3")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {confirmProject && (
        <div
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setConfirmDeleteId(null)
          }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 10000,
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
            aria-label="Delete project"
            style={{
              width: "100%",
              maxWidth: 360,
              background: "#FFFFFF",
              borderRadius: 12,
              boxShadow: "0 24px 70px rgba(0,0,0,0.4)",
              padding: 22,
            }}
          >
            <p style={{ fontSize: 15, fontWeight: 600, color: "#1D1D1F" }}>Delete project?</p>
            <p style={{ fontSize: 13.5, color: "#6B6B70", marginTop: 6, lineHeight: 1.5 }}>
              {'"'}
              {confirmProject.name}
              {'"'} will be deleted. Its tasks will be kept but moved out of the project.
            </p>
            <div className="flex items-center justify-end gap-2" style={{ marginTop: 18 }}>
              <button
                onClick={() => setConfirmDeleteId(null)}
                style={{
                  padding: "8px 14px",
                  fontSize: 13,
                  fontWeight: 500,
                  color: "#48484A",
                  background: "#F0F0F3",
                  border: "1px solid #E2E2E6",
                  borderRadius: 7,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDeleteProject?.(confirmProject.id)
                  setConfirmDeleteId(null)
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

export type { TodoSelection }
