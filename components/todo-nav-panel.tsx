"use client"

import { useState } from "react"
import {
  Inbox,
  Star,
  CalendarDays,
  Layers,
  Archive,
  Circle,
  Plus,
  ChevronRight,
} from "lucide-react"
import type { SectionId, Task, Project } from "@/lib/todos"
import { countSection } from "@/lib/todos"

type TodoSelection =
  | { kind: "section"; id: SectionId }
  | { kind: "project"; id: string }

interface TodoNavPanelProps {
  tasks: Task[]
  projects: Project[]
  selection: TodoSelection
  onSelect: (sel: TodoSelection) => void
  onNewProject: () => void
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

export function TodoNavPanel({
  tasks,
  projects,
  selection,
  onSelect,
  onNewProject,
}: TodoNavPanelProps) {
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
            return (
              <button
                key={proj.id}
                onClick={() => onSelect({ kind: "project", id: proj.id })}
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
    </aside>
  )
}

export type { TodoSelection }
