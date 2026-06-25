"use client"

import { useState, useMemo, useRef, useEffect, useCallback } from "react"
import { Plus, Star, Inbox, CalendarDays, Layers, Archive, Check, X, ChevronDown } from "lucide-react"
import { TodoTaskRow } from "./todo-task-row"
import type { Task, Project, SectionId } from "@/lib/todos"
import type { TodoSelection } from "./todo-nav-panel"
import {
  taskMatchesSection,
  formatLongDate,
  upcomingGroupLabel,
  daysFromToday,
  todayISO,
} from "@/lib/todos"

interface TodoListViewProps {
  selection: TodoSelection
  tasks: Task[]
  projects: Project[]
  onToggleTask: (id: string) => void
  onToggleSubtask: (taskId: string, subId: string) => void
  onAddTask: (input: NewTaskInput) => void
  onUpdateTitle: (id: string, title: string) => void
  onDeleteTask: (id: string) => void
  onUpdateDue: (id: string, due: string | null) => void
}

export interface NewTaskInput {
  title: string
  due: string | null
  tag: string | null
  notes: string | null
}

const SECTION_META: Record<SectionId, { label: string; icon: typeof Star; color: string }> = {
  inbox:    { label: "Inbox",    icon: Inbox,        color: "#5E6AD2" },
  today:    { label: "Today",    icon: Star,         color: "#F5C518" },
  upcoming: { label: "Upcoming", icon: CalendarDays, color: "#E0533D" },
  anytime:  { label: "Anytime",  icon: Layers,       color: "#37C2C4" },
  someday:  { label: "Someday",  icon: Archive,      color: "#C8A45C" },
}

export function TodoListView({
  selection,
  tasks,
  projects,
  onToggleTask,
  onToggleSubtask,
  onAddTask,
  onUpdateTitle,
  onDeleteTask,
  onUpdateDue,
}: TodoListViewProps) {
  const [quickAddOpen, setQuickAddOpen] = useState(false)
  const [showCompleted, setShowCompleted] = useState(false)

  // Resolve the active list of tasks for the current selection
  const { activeTasks, completedTasks } = useMemo(() => {
    let filtered: Task[]
    if (selection.kind === "project") {
      filtered = tasks.filter((t) => t.projectId === selection.id)
    } else {
      filtered = tasks.filter((t) => taskMatchesSection(t, selection.id))
    }
    return {
      activeTasks: filtered.filter((t) => !t.done).sort((a, b) => a.order - b.order),
      completedTasks: filtered.filter((t) => t.done).sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0)),
    }
  }, [tasks, selection])

  const project = selection.kind === "project" ? projects.find((p) => p.id === selection.id) : null
  const sectionMeta = selection.kind === "section" ? SECTION_META[selection.id] : null
  const isToday = selection.kind === "section" && selection.id === "today"
  const isUpcoming = selection.kind === "section" && selection.id === "upcoming"

  // Keyboard "N" to open quick add
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement
      const typing = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable
      if (!typing && (e.key === "n" || e.key === "N")) {
        e.preventDefault()
        setQuickAddOpen(true)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  const handleAdd = useCallback((input: NewTaskInput) => {
    onAddTask(input)
  }, [onAddTask])

  return (
    <main
      className="flex flex-col h-full relative"
      style={{ flex: 1, backgroundColor: "#FFFFFF", minWidth: 0 }}
      aria-label="Task list"
    >
      <div className="flex-1 overflow-y-auto">
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "40px 44px 120px" }}>
          {/* ── Header ── */}
          {isToday ? (
            <div className="flex items-center gap-3 mb-1">
              <Star size={26} strokeWidth={2} fill="#F5C518" style={{ color: "#F5C518" }} aria-hidden="true" />
              <h1 style={{ fontSize: 28, fontWeight: 700, color: "#1D1D1F", letterSpacing: "-0.02em" }}>
                Today
              </h1>
            </div>
          ) : (
            <div className="flex items-center gap-2.5 mb-1">
              {sectionMeta && (
                <sectionMeta.icon
                  size={24}
                  strokeWidth={2}
                  fill={selection.kind === "section" && selection.id === "today" ? sectionMeta.color : "none"}
                  style={{ color: sectionMeta.color }}
                  aria-hidden="true"
                />
              )}
              {project && (
                <span style={{ fontSize: 24, lineHeight: 1 }} aria-hidden="true">{project.emoji}</span>
              )}
              <h1 style={{ fontSize: 26, fontWeight: 700, color: "#1D1D1F", letterSpacing: "-0.02em" }}>
                {project ? project.name : sectionMeta?.label}
              </h1>
            </div>
          )}

          {/* Date subtitle for Today */}
          {isToday && (
            <p style={{ fontSize: 15, color: "#8E8E93", fontWeight: 500, marginLeft: 38, marginBottom: 22 }}>
              {formatLongDate(new Date())}
            </p>
          )}
          {project?.area && (
            <p style={{ fontSize: 13.5, color: "#A1A1A6", marginLeft: 34, marginBottom: 18 }}>{project.area}</p>
          )}
          {!isToday && !project?.area && <div style={{ height: 18 }} />}

          {/* ── Quick add ── */}
          {quickAddOpen && (
            <QuickAddInput
              onCancel={() => setQuickAddOpen(false)}
              onSave={(input) => { handleAdd(input); setQuickAddOpen(false) }}
            />
          )}

          {/* ── Task list ── */}
          {activeTasks.length === 0 && completedTasks.length === 0 ? (
            <EmptyState section={selection.kind === "section" ? selection.id : null} />
          ) : isUpcoming ? (
            <UpcomingGroups
              tasks={activeTasks}
              onToggleTask={onToggleTask}
              onToggleSubtask={onToggleSubtask}
              onUpdateTitle={onUpdateTitle}
              onDeleteTask={onDeleteTask}
              onUpdateDue={onUpdateDue}
            />
          ) : project ? (
            <ProjectTaskList
              project={project}
              tasks={activeTasks}
              onToggleTask={onToggleTask}
              onToggleSubtask={onToggleSubtask}
              onUpdateTitle={onUpdateTitle}
              onDeleteTask={onDeleteTask}
              onUpdateDue={onUpdateDue}
            />
          ) : (
            <div className="flex flex-col">
              {activeTasks.map((task) => (
                <TodoTaskRow
                  key={task.id}
                  task={task}
                  onToggle={onToggleTask}
                  onToggleSubtask={onToggleSubtask}
                  onUpdateTitle={onUpdateTitle}
                  onDelete={onDeleteTask}
                  onUpdateDue={onUpdateDue}
                />
              ))}
            </div>
          )}

          {/* ── Completed toggle ── */}
          {completedTasks.length > 0 && (
            <div style={{ marginTop: 18 }}>
              <button
                onClick={() => setShowCompleted((s) => !s)}
                className="flex items-center gap-1.5"
                style={{ fontSize: 13, fontWeight: 500, color: "#A1A1A6", padding: "4px 10px" }}
              >
                <ChevronDown
                  size={14}
                  strokeWidth={2.5}
                  style={{ transform: showCompleted ? "none" : "rotate(-90deg)", transition: "transform 0.15s ease" }}
                  aria-hidden="true"
                />
                {showCompleted ? "Hide" : "Show"} {completedTasks.length} Completed
              </button>
              {showCompleted && (
                <div className="flex flex-col mt-1">
                  {completedTasks.map((task) => (
                    <TodoTaskRow
                      key={task.id}
                      task={task}
                      onToggle={onToggleTask}
                      onToggleSubtask={onToggleSubtask}
                      onUpdateTitle={onUpdateTitle}
                      onDelete={onDeleteTask}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Floating + button */}
      <button
        onClick={() => setQuickAddOpen(true)}
        aria-label="New task (N)"
        className="todo-fab"
        style={{
          position: "absolute",
          bottom: 28,
          right: 28,
          width: 48,
          height: 48,
          borderRadius: "50%",
          backgroundColor: "#007AFF",
          color: "#FFFFFF",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 14px rgba(0, 122, 255, 0.45)",
          zIndex: 20,
        }}
      >
        <Plus size={22} strokeWidth={2.5} aria-hidden="true" />
      </button>
    </main>
  )
}

// ─── Upcoming, grouped by date ────────────────────────────────────────────────
function UpcomingGroups({
  tasks,
  onToggleTask,
  onToggleSubtask,
  onUpdateTitle,
  onDeleteTask,
  onUpdateDue,
}: {
  tasks: Task[]
  onToggleTask: (id: string) => void
  onToggleSubtask: (taskId: string, subId: string) => void
  onUpdateTitle: (id: string, title: string) => void
  onDeleteTask: (id: string) => void
  onUpdateDue: (id: string, due: string | null) => void
}) {
  const groups = useMemo(() => {
    const sorted = [...tasks].sort((a, b) => (a.due ?? "").localeCompare(b.due ?? ""))
    const map = new Map<string, Task[]>()
    for (const t of sorted) {
      if (!t.due) continue
      const label = upcomingGroupLabel(t.due)
      if (!map.has(label)) map.set(label, [])
      map.get(label)!.push(t)
    }
    return Array.from(map.entries())
  }, [tasks])

  return (
    <div className="flex flex-col gap-5">
      {groups.map(([label, groupTasks]) => (
        <div key={label}>
          <h2 style={{ fontSize: 13, fontWeight: 700, color: "#8E8E93", marginBottom: 4, paddingLeft: 10, letterSpacing: "-0.01em" }}>
            {label}
          </h2>
          <div className="flex flex-col">
            {groupTasks.map((task) => (
              <TodoTaskRow
                key={task.id}
                task={task}
                onToggle={onToggleTask}
                onToggleSubtask={onToggleSubtask}
                onUpdateTitle={onUpdateTitle}
                onDelete={onDeleteTask}
                onUpdateDue={onUpdateDue}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Project list with inline headings ────────────────────────────────────────
function ProjectTaskList({
  project,
  tasks,
  onToggleTask,
  onToggleSubtask,
  onUpdateTitle,
  onDeleteTask,
  onUpdateDue,
}: {
  project: Project
  tasks: Task[]
  onToggleTask: (id: string) => void
  onToggleSubtask: (taskId: string, subId: string) => void
  onUpdateTitle: (id: string, title: string) => void
  onDeleteTask: (id: string) => void
  onUpdateDue: (id: string, due: string | null) => void
}) {
  // Build an interleaved list of headings + tasks ordered by `order`
  const items = useMemo(() => {
    type Item = { type: "heading"; order: number; title: string; id: string } | { type: "task"; order: number; task: Task }
    const list: Item[] = []
    for (const h of project.headings) list.push({ type: "heading", order: h.order, title: h.title, id: h.id })
    for (const t of tasks) list.push({ type: "task", order: t.order, task: t })
    return list.sort((a, b) => a.order - b.order)
  }, [project.headings, tasks])

  return (
    <div className="flex flex-col">
      {items.map((item) =>
        item.type === "heading" ? (
          <h2
            key={item.id}
            style={{
              fontSize: 13.5,
              fontWeight: 700,
              color: "#007AFF",
              marginTop: 14,
              marginBottom: 2,
              paddingLeft: 10,
              paddingBottom: 6,
              borderBottom: "1px solid #ECECEF",
            }}
          >
            {item.title}
          </h2>
        ) : (
          <TodoTaskRow
            key={item.task.id}
            task={item.task}
            onToggle={onToggleTask}
            onToggleSubtask={onToggleSubtask}
            onUpdateTitle={onUpdateTitle}
            onDelete={onDeleteTask}
            onUpdateDue={onUpdateDue}
          />
        )
      )}
    </div>
  )
}

// ─── Empty states ─────────────────────────────────────────────────────────────
function EmptyState({ section }: { section: SectionId | null }) {
  const messages: Record<string, string> = {
    inbox: "Your Inbox is empty",
    today: "Nothing planned for today",
    upcoming: "No upcoming tasks",
    anytime: "Nothing to do right now",
    someday: "No someday tasks yet",
  }
  const msg = section ? messages[section] ?? "Nothing here yet" : "No tasks in this project"
  return (
    <div className="flex flex-col items-center justify-center" style={{ padding: "70px 0", gap: 14 }}>
      <div
        style={{
          width: 52, height: 52, borderRadius: "50%",
          backgroundColor: "#F0F0F3",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >
        <Check size={24} strokeWidth={2.5} style={{ color: "#C7C7CC" }} aria-hidden="true" />
      </div>
      <p style={{ fontSize: 15, color: "#A1A1A6", fontWeight: 500 }}>{msg}</p>
      <p style={{ fontSize: 13, color: "#C7C7CC" }}>{"Press "}<kbd style={{ fontFamily: "inherit", fontWeight: 600 }}>N</kbd>{" to add a task"}</p>
    </div>
  )
}

// ─── Quick add input ──────────────────────────────────────────────────────────
function QuickAddInput({
  onSave,
  onCancel,
}: {
  onSave: (input: NewTaskInput) => void
  onCancel: () => void
}) {
  const [title, setTitle] = useState("")
  const [due, setDue] = useState<string>("")
  const [tag, setTag] = useState("")
  const [notes, setNotes] = useState("")
  const [notesOpen, setNotesOpen] = useState(false)
  const titleRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    titleRef.current?.focus()
  }, [])

  function save() {
    const t = title.trim()
    if (!t) { onCancel(); return }
    onSave({
      title: t,
      due: due || null,
      tag: tag.trim() || null,
      notes: notes.trim() || null,
    })
  }

  return (
    <div
      className="todo-quick-add"
      style={{
        border: "1px solid #DCDCE0",
        borderRadius: 12,
        padding: "12px 14px",
        marginBottom: 14,
        boxShadow: "0 6px 20px rgba(0,0,0,0.07)",
        backgroundColor: "#FFFFFF",
      }}
    >
      {/* Title row */}
      <div className="flex items-center gap-2.5">
        <span
          style={{
            width: 18, height: 18, borderRadius: "50%",
            border: "1.5px solid #C7C7CC", flexShrink: 0,
          }}
          aria-hidden="true"
        />
        <input
          ref={titleRef}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") save()
            if (e.key === "Escape") onCancel()
          }}
          placeholder="New To-Do"
          aria-label="Task title"
          className="flex-1 bg-transparent outline-none"
          style={{ fontSize: 15, color: "#1D1D1F", fontWeight: 500 }}
        />
        <button onClick={onCancel} aria-label="Cancel" style={{ color: "#C7C7CC", flexShrink: 0 }}>
          <X size={16} strokeWidth={2.5} aria-hidden="true" />
        </button>
      </div>

      {/* Notes (expandable) */}
      {notesOpen && (
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Escape") onCancel() }}
          placeholder="Notes"
          aria-label="Notes"
          rows={2}
          className="w-full bg-transparent outline-none resize-none"
          style={{ fontSize: 13.5, color: "#48484A", marginTop: 8, paddingLeft: 28 }}
        />
      )}

      {/* Meta row */}
      <div className="flex items-center gap-2 flex-wrap" style={{ marginTop: 10, paddingLeft: 28 }}>
        <label className="flex items-center gap-1.5" style={{ fontSize: 12.5, color: "#8E8E93" }}>
          <CalendarDays size={14} strokeWidth={2} aria-hidden="true" />
          <input
            type="date"
            value={due}
            onChange={(e) => setDue(e.target.value)}
            aria-label="Due date"
            className="bg-transparent outline-none"
            style={{ fontSize: 12.5, color: due ? "#007AFF" : "#8E8E93", fontWeight: 500, colorScheme: "light" }}
          />
        </label>
        <input
          value={tag}
          onChange={(e) => setTag(e.target.value)}
          placeholder="+ Tag"
          aria-label="Tag"
          className="bg-transparent outline-none"
          style={{ fontSize: 12.5, color: "#8E8E93", width: 70 }}
        />
        {!notesOpen && (
          <button
            onClick={() => setNotesOpen(true)}
            style={{ fontSize: 12.5, color: "#8E8E93", fontWeight: 500 }}
          >
            + Notes
          </button>
        )}
        <div className="flex-1" />
        <button
          onClick={save}
          style={{
            fontSize: 12.5, fontWeight: 600, color: "#FFFFFF",
            backgroundColor: "#007AFF", borderRadius: 6, padding: "4px 12px",
          }}
        >
          Add
        </button>
      </div>
    </div>
  )
}
