"use client"

import { useState, useRef, useEffect } from "react"
import { Check, ChevronRight, Calendar } from "lucide-react"
import type { Task } from "@/lib/todos"
import { formatDueLabel, isOverdue, isToday } from "@/lib/todos"

interface TaskRowProps {
  task: Task
  /** Accent color for the checkbox fill (defaults to Things blue) */
  accent?: string
  showProjectMeta?: boolean
  onToggle: (id: string) => void
  onToggleSubtask: (taskId: string, subId: string) => void
  onUpdateTitle?: (id: string, title: string) => void
}

const ACCENT = "#007AFF"
const OVERDUE = "#E0533D"

export function TodoTaskRow({
  task,
  accent = ACCENT,
  onToggle,
  onToggleSubtask,
  onUpdateTitle,
}: TaskRowProps) {
  const [expanded, setExpanded] = useState(false)
  const [completing, setCompleting] = useState(false)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(task.title)
  const inputRef = useRef<HTMLInputElement>(null)

  const hasSubtasks = task.subtasks.length > 0
  const doneSubs = task.subtasks.filter((s) => s.done).length
  const overdue = isOverdue(task.due)

  useEffect(() => {
    if (editing) inputRef.current?.focus()
  }, [editing])

  function handleCheck() {
    if (task.done) {
      onToggle(task.id)
      return
    }
    // Animate, then commit completion after the fade
    setCompleting(true)
    window.setTimeout(() => onToggle(task.id), 850)
  }

  function commitEdit() {
    setEditing(false)
    const trimmed = draft.trim()
    if (trimmed && trimmed !== task.title) onUpdateTitle?.(task.id, trimmed)
    else setDraft(task.title)
  }

  return (
    <div className={completing ? "todo-task-completing" : ""}>
      <div
        className="todo-task-row group flex items-start gap-2.5 rounded-lg"
        style={{ padding: "7px 10px" }}
      >
        {/* Checkbox */}
        <button
          onClick={handleCheck}
          aria-label={task.done ? "Mark incomplete" : "Complete task"}
          aria-pressed={task.done}
          className="flex items-center justify-center"
          style={{ marginTop: 1, flexShrink: 0, height: 20, width: 20 }}
        >
          <span
            style={{
              width: 18,
              height: 18,
              borderRadius: "50%",
              border: task.done || completing ? "none" : "1.5px solid #C7C7CC",
              backgroundColor: task.done || completing ? accent : "transparent",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "background-color 0.2s ease, border-color 0.2s ease",
            }}
          >
            {(task.done || completing) && (
              <Check
                className="todo-check-mark"
                size={12}
                strokeWidth={3}
                style={{ color: "#FFFFFF" }}
                aria-hidden="true"
              />
            )}
          </span>
        </button>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {/* Expand arrow (only if subtasks) */}
            {hasSubtasks && (
              <button
                onClick={() => setExpanded((e) => !e)}
                aria-label={expanded ? "Collapse subtasks" : "Expand subtasks"}
                aria-expanded={expanded}
                style={{ flexShrink: 0, color: "#B0B0B5", marginLeft: -2 }}
              >
                <ChevronRight
                  size={14}
                  strokeWidth={2.5}
                  style={{
                    transform: expanded ? "rotate(90deg)" : "none",
                    transition: "transform 0.15s ease",
                  }}
                  aria-hidden="true"
                />
              </button>
            )}

            {/* Title */}
            {editing ? (
              <input
                ref={inputRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={commitEdit}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitEdit()
                  if (e.key === "Escape") { setDraft(task.title); setEditing(false) }
                }}
                className="flex-1 bg-transparent outline-none"
                style={{ fontSize: 14.5, color: "#1D1D1F", fontWeight: 400 }}
              />
            ) : (
              <span
                onDoubleClick={() => onUpdateTitle && setEditing(true)}
                className="flex-1 truncate"
                style={{
                  fontSize: 14.5,
                  color: task.done ? "#B0B0B5" : "#1D1D1F",
                  textDecoration: task.done ? "line-through" : "none",
                  fontWeight: 400,
                }}
              >
                {task.title}
              </span>
            )}

            {/* Right-side meta */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {task.tag && (
                <span
                  style={{
                    fontSize: 11.5,
                    fontWeight: 500,
                    color: "#8E8E93",
                    backgroundColor: "#F0F0F3",
                    borderRadius: 4,
                    padding: "1px 6px",
                  }}
                >
                  {task.tag}
                </span>
              )}
              {hasSubtasks && (
                <span style={{ fontSize: 11.5, color: "#B0B0B5", fontVariantNumeric: "tabular-nums" }}>
                  {doneSubs}/{task.subtasks.length}
                </span>
              )}
              {task.due && (
                <span
                  className="flex items-center gap-1"
                  style={{
                    fontSize: 12.5,
                    fontWeight: 500,
                    color: overdue ? OVERDUE : isToday(task.due) ? ACCENT : "#8E8E93",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  <Calendar size={12} strokeWidth={2} aria-hidden="true" />
                  {formatDueLabel(task.due)}
                </span>
              )}
            </div>
          </div>

          {/* Notes preview */}
          {task.notes && !task.done && (
            <p
              className="truncate"
              style={{ fontSize: 12.5, color: "#A1A1A6", marginTop: 2 }}
            >
              {task.notes}
            </p>
          )}

          {/* Subtasks */}
          {hasSubtasks && expanded && (
            <div className="todo-subtasks flex flex-col gap-0.5 mt-1.5 mb-0.5">
              {task.subtasks.map((sub) => (
                <div key={sub.id} className="flex items-center gap-2.5" style={{ paddingLeft: 2 }}>
                  <button
                    onClick={() => onToggleSubtask(task.id, sub.id)}
                    aria-label={sub.done ? "Mark subtask incomplete" : "Complete subtask"}
                    aria-pressed={sub.done}
                    className="flex items-center justify-center"
                    style={{ flexShrink: 0 }}
                  >
                    <span
                      style={{
                        width: 15,
                        height: 15,
                        borderRadius: "50%",
                        border: sub.done ? "none" : "1.5px solid #D1D1D6",
                        backgroundColor: sub.done ? accent : "transparent",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "background-color 0.15s ease",
                      }}
                    >
                      {sub.done && (
                        <Check size={9} strokeWidth={3.5} style={{ color: "#FFFFFF" }} aria-hidden="true" />
                      )}
                    </span>
                  </button>
                  <span
                    style={{
                      fontSize: 13.5,
                      color: sub.done ? "#B0B0B5" : "#48484A",
                      textDecoration: sub.done ? "line-through" : "none",
                    }}
                  >
                    {sub.title}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
