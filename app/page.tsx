"use client"

import { useState, useCallback, useEffect, useMemo, useRef } from "react"
import { useRouter } from "next/navigation"
import { Plus } from "lucide-react"
import { IconSidebar } from "@/components/icon-sidebar"
import { NoteListPanel, type Note } from "@/components/note-list-panel"
import { NoteEditor, type NoteChanges } from "@/components/note-editor"
import { InboxView } from "@/components/inbox-view"
import { QuickCaptureModal, type CapturedNote } from "@/components/quick-capture-modal"
import { TagsPanel } from "@/components/tags-panel"
import { buildTagRegistry, getTagColor, type TagEntry } from "@/lib/tags"
import type { NoteTag } from "@/components/note-list-panel"
import { TodoNavPanel, type TodoSelection } from "@/components/todo-nav-panel"
import { TodoListView, type NewTaskInput } from "@/components/todo-list-view"
import {
  INITIAL_TASKS,
  INITIAL_PROJECTS,
  type Task,
  type Project,
} from "@/lib/todos"
import { SettingsModal, DEFAULT_SETTINGS, type Settings } from "@/components/settings-modal"
import { createClient } from "@/lib/supabase/client"
import {
  fetchNotes,
  fetchTasks,
  fetchProjects,
  insertNote,
  updateNote,
  deleteNote,
  insertTask,
  updateTask,
  deleteTask,
  insertProject,
  seedInitialData,
} from "@/lib/db"

// ── Rich HTML seed content per note ────────────────────────────────────────
export const NOTE_CONTENT: Record<string, string> = {
  "1": `<h2>This week in review</h2><p>Started the week with a clear head. Finished the onboarding redesign and got <strong>positive feedback</strong> from the team.</p><h3>Open items</h3><ul data-type="taskList"><li data-checked="false" data-type="taskItem"><label><input type="checkbox" /></label><div><p>Follow up on API rate-limiting ticket before Thursday</p></div></li><li data-checked="true" data-type="taskItem"><label><input type="checkbox" checked /></label><div><p>Ship the onboarding flow redesign</p></div></li><li data-checked="false" data-type="taskItem"><label><input type="checkbox" /></label><div><p>Schedule 1:1 with design team</p></div></li></ul><h3>Highlights</h3><ul><li>The new component library is 40% smaller than before</li><li>Team morale is high after the retrospective</li><li>Got unblocked on the auth flow</li></ul><blockquote><p>Consistency beats intensity. Show up every day, even if only for 20 minutes.</p></blockquote>`,

  "2": `<h2>System 1 vs System 2</h2><p>Kahneman's central thesis: the mind operates via two distinct systems of thought.</p><ul><li><strong>System 1</strong> — operates automatically and quickly, with little or no effort and no sense of voluntary control.</li><li><strong>System 2</strong> — allocates attention to the effortful mental activities that demand it, including complex computations.</li></ul><h3>Key concepts</h3><ol><li><em>Anchoring effect</em> — exposure to a number influences subsequent estimates</li><li><em>Availability heuristic</em> — judging likelihood by how easily examples come to mind</li><li><em>Loss aversion</em> — losses loom larger than equivalent gains</li></ol><h3>Favourite quote</h3><blockquote><p>Nothing in life is as important as you think it is, while you are thinking about it.</p></blockquote>`,

  "3": `<h2>Ideas worth building</h2><h3>Apps</h3><ul data-type="taskList"><li data-checked="false" data-type="taskItem"><label><input type="checkbox" /></label><div><p>Minimal Pomodoro with a physical-timer aesthetic</p></div></li><li data-checked="false" data-type="taskItem"><label><input type="checkbox" /></label><div><p>Recipe manager that works fully offline</p></div></li><li data-checked="true" data-type="taskItem"><label><input type="checkbox" checked /></label><div><p>Local-first journaling tool with E2E encryption</p></div></li></ul><h3>Technical notes</h3><p>For the offline recipe app, consider using <code>IndexedDB</code> via Dexie.js and a service worker for asset caching. The sync layer can be built on CRDTs.</p><pre><code class="language-typescript">// Rough data model
interface Recipe {
  id: string
  title: string
  ingredients: Ingredient[]
  steps: string[]
  tags: string[]
  createdAt: Date
}</code></pre>`,

  "4": `<h2>Tasting log</h2><h3>Ethiopia Yirgacheffe — Jun 17</h3><p>Roast: <strong>Light</strong> · Origin: <em>Gedeo Zone, Ethiopia</em> · Process: Washed</p><ul><li>Tasting notes: floral, bergamot, stone fruit, light body</li><li>Brew method: V60 pour-over</li><li>Water temp: 93°C</li><li>Ratio: 1:16 (18g coffee, 288g water)</li><li>Bloom: 30s with 36g water</li><li>Total brew time: 3:18</li></ul><blockquote><p>Best cup I've had in months. The bergamot note is unmistakable.</p></blockquote><h3>Colombia Huila — Jun 10</h3><ul><li>Tasting notes: caramel, hazelnut, milk chocolate</li><li>Brew method: AeroPress</li><li>Water temp: 88°C</li><li>Ratio: 1:14</li></ul>`,

  "5": `<h2>Markdown quick reference</h2><h3>Headings</h3><pre><code class="language-markdown"># H1 — large heading
## H2 — medium heading
### H3 — small heading</code></pre><h3>Inline formatting</h3><p>Use <strong>**double asterisks**</strong> for bold, <em>_underscores_</em> for italic, and <code>\`backticks\`</code> for inline code.</p><h3>Lists</h3><pre><code class="language-markdown">- Bullet item
- Another item

1. Numbered item
2. Second item

- [ ] Unchecked task
- [x] Checked task</code></pre><h3>Blockquote</h3><blockquote><p>Prefix a line with <code>&gt;</code> to create a blockquote like this one.</p></blockquote><hr />`,

  "6": `<h2>Lisbon trip — September</h2><h3>Logistics</h3><ul data-type="taskList"><li data-checked="true" data-type="taskItem"><label><input type="checkbox" checked /></label><div><p>Book flights (TAP Air Portugal, Sep 4–11)</p></div></li><li data-checked="false" data-type="taskItem"><label><input type="checkbox" /></label><div><p>Book accommodation in Alfama or Mouraria</p></div></li><li data-checked="false" data-type="taskItem"><label><input type="checkbox" /></label><div><p>Reserve table at Time Out Market</p></div></li></ul><h3>Must-do</h3><ol><li>Pastéis de nata at <strong>Pastéis de Belém</strong> (arrive early)</li><li>Day trip to <strong>Sintra</strong> — Pena Palace + Quinta da Regaleira</li><li>Sunset at Miradouro da Graça</li><li>Ride <em>Tram 28</em> through Alfama</li><li>Fado night in a small tasca</li></ol><blockquote><p>Lisbon is one of the few cities that feels genuinely ancient and effortlessly cool at the same time.</p></blockquote>`,

  "7": `<h2>Typography system</h2><p>Using a <strong>modular scale</strong> with a 1.250 ratio (Major Third). Base: 16px.</p><h3>Scale</h3><pre><code class="language-css">/* Type scale */
--text-xs:   12px;   /* captions, labels */
--text-sm:   14px;   /* UI, note list */
--text-base: 16px;   /* base */
--text-body: 17px;   /* long-form prose */
--text-h3:   20px;
--text-h2:   25px;
--text-h1:   31px;
--text-hero: 39px;</code></pre><h3>Line heights</h3><ul><li>Body prose: <code>1.8</code> — maximises readability for long reads</li><li>UI text: <code>1.4</code> — tighter for labels and navigation</li><li>Headings: <code>1.15–1.25</code> — optical balance</li></ul><h3>Font pairing</h3><p><strong>iA Writer Quattro</strong> for all prose. <strong>Inter</strong> for UI chrome. Both designed for screen legibility at small sizes.</p>`,

  "8": `<h2>Words worth keeping</h2><blockquote><p>The scariest moment is always just before you start. — <strong>Stephen King</strong></p></blockquote><blockquote><p>You miss 100% of the shots you don't take. — <strong>Wayne Gretzky</strong></p></blockquote><blockquote><p>Perfection is achieved not when there is nothing more to add, but when there is nothing left to take away. — <strong>Antoine de Saint-Exupéry</strong></p></blockquote><blockquote><p>The unexamined life is not worth living. — <strong>Socrates</strong></p></blockquote><blockquote><p>We are what we repeatedly do. Excellence, then, is not an act but a habit. — <strong>Aristotle</strong></p></blockquote><h3>On craft</h3><ul><li><em>"Good design is as little design as possible."</em> — Dieter Rams</li><li><em>"Simplicity is the ultimate sophistication."</em> — Leonardo da Vinci</li></ul>`,
}

// ── Seed data ──────────────────────────────────────────────────────────────
const INITIAL_NOTES: Note[] = [
  {
    id: "1",
    title: "Weekly Review — June 2025",
    preview:
      "Started the week with a clear head. Finished the onboarding redesign and got positive feedback from the team.",
    date: "Today",
    tags: [
      { label: "Work", color: "bg-amber-100", textColor: "text-amber-700" },
      { label: "Weekly", color: "bg-sky-100", textColor: "text-sky-700" },
    ],
  },
  {
    id: "2",
    title: "Reading notes: Thinking, Fast and Slow",
    preview:
      "System 1 operates automatically and quickly, with little or no effort and no sense of voluntary control.",
    date: "Yesterday",
    tags: [
      { label: "Books", color: "bg-emerald-100", textColor: "text-emerald-700" },
    ],
  },
  {
    id: "3",
    title: "Side project ideas",
    preview:
      "A minimal Pomodoro app with a physical-timer aesthetic. A recipe manager that works offline.",
    date: "Jun 19",
    tags: [
      { label: "Ideas", color: "bg-rose-100", textColor: "text-rose-700" },
      { label: "Dev", color: "bg-violet-100", textColor: "text-violet-700" },
    ],
  },
  {
    id: "4",
    title: "Coffee tasting log",
    preview:
      "Ethiopia Yirgacheffe — floral, bergamot, light body. Brewed at 93°C with a 1:16 ratio on the V60.",
    date: "Jun 17",
    tags: [
      { label: "Personal", color: "bg-amber-100", textColor: "text-amber-700" },
    ],
  },
  {
    id: "5",
    title: "Markdown cheatsheet",
    preview:
      "H1, H2, H3 headings — bold, italic, inline code — code blocks — blockquotes — task lists.",
    date: "Jun 14",
    tags: [
      { label: "Reference", color: "bg-sky-100", textColor: "text-sky-700" },
    ],
  },
  {
    id: "6",
    title: "Trip planning — Lisbon",
    preview:
      "Fly into LIS, stay in Alfama or Mouraria. Must-try: pastéis de nata at Pastéis de Belém.",
    date: "Jun 10",
    tags: [
      { label: "Travel", color: "bg-emerald-100", textColor: "text-emerald-700" },
      { label: "Personal", color: "bg-amber-100", textColor: "text-amber-700" },
    ],
  },
  {
    id: "7",
    title: "Typography scale notes",
    preview:
      "Using a modular scale with a 1.25 ratio. Base: 16px. H1 → 31px, body → 17px, line-height 1.8.",
    date: "Jun 8",
    tags: [
      { label: "Design", color: "bg-violet-100", textColor: "text-violet-700" },
    ],
  },
  {
    id: "8",
    title: "Quotes worth remembering",
    preview:
      '"The scariest moment is always just before you start." — Stephen King.',
    date: "Jun 3",
    tags: [
      { label: "Inspiration", color: "bg-rose-100", textColor: "text-rose-700" },
    ],
  },
]

// ── Page ───────────────────────────────────────────────────────────────────
export default function Page() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const userIdRef = useRef<string | null>(null)

  const [notes, setNotes] = useState<Note[]>([])
  const [activeNoteId, setActiveNoteId] = useState<string>("")
  const [activeNav, setActiveNav] = useState<"inbox" | "notes" | "todos" | "tags" | "search">("notes")
  const [captureOpen, setCaptureOpen] = useState(false)
  const [activeFilterTag, setActiveFilterTag] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // ── Load the signed-in user's data from Supabase (seed on first run) ──
  useEffect(() => {
    let cancelled = false
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.replace("/auth")
        return
      }
      userIdRef.current = user.id

      try {
        let [loadedNotes, loadedTasks, loadedProjects] = await Promise.all([
          fetchNotes(supabase),
          fetchTasks(supabase),
          fetchProjects(supabase),
        ])

        // First run: nothing stored yet → seed the demo content.
        if (loadedNotes.length === 0 && loadedTasks.length === 0 && loadedProjects.length === 0) {
          const seeded = await seedInitialData(supabase, user.id, {
            notes: INITIAL_NOTES.map((n) => ({
              note: {
                title: n.title,
                preview: n.preview,
                tags: n.tags,
                inInbox: n.inInbox,
              },
              content: NOTE_CONTENT[n.id] ?? (n.preview ? `<p>${n.preview}</p>` : "<p></p>"),
            })),
            projects: INITIAL_PROJECTS.map((p) => ({
              seedId: p.id,
              name: p.name,
              emoji: p.emoji,
              area: p.area,
              headings: p.headings,
            })),
            tasks: INITIAL_TASKS,
          })
          loadedNotes = seeded.notes
          loadedTasks = seeded.tasks
          loadedProjects = seeded.projects
        }

        if (cancelled) return
        setNotes(loadedNotes)
        setTasks(loadedTasks)
        setProjects(loadedProjects)
        const firstRegular = loadedNotes.find((n) => !n.inInbox)
        setActiveNoteId(firstRegular?.id ?? "")
      } catch (err) {
        console.error("[v0] Failed to load data:", err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Sign out and return to the auth screen
  const handleSignOut = useCallback(async () => {
    await supabase.auth.signOut()
    router.replace("/auth")
  }, [supabase, router])

  // ── Settings state ──
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)

  // Apply live-preview settings (accent + editor typography) to the document root
  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty("--color-bear-accent", settings.accent)
    root.style.setProperty("--color-accent", settings.accent)
    root.style.setProperty("--color-ring", settings.accent)
    root.style.setProperty("--color-sidebar-ring", settings.accent)

    const sizes = { small: "15px", medium: "17px", large: "19px" } as const
    root.style.setProperty("--editor-font-size", sizes[settings.editorFontSize])

    const spacing = { compact: "1.5", normal: "1.8", relaxed: "2.1" } as const
    root.style.setProperty("--editor-line-height", spacing[settings.lineSpacing])
  }, [settings])

  // ── To-do state ──
  const [tasks, setTasks] = useState<Task[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [todoSelection, setTodoSelection] = useState<TodoSelection>({ kind: "section", id: "today" })

  // Toggle a task complete/incomplete
  const handleToggleTask = useCallback((id: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t
        const done = !t.done
        const completedAt = done ? Date.now() : null
        updateTask(supabase, id, { done, completedAt }).catch((e) =>
          console.error("[v0] toggle task failed:", e)
        )
        return { ...t, done, completedAt }
      })
    )
  }, [supabase])

  // Toggle a subtask
  const handleToggleSubtask = useCallback((taskId: string, subId: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t
        const subtasks = t.subtasks.map((s) => (s.id === subId ? { ...s, done: !s.done } : s))
        updateTask(supabase, taskId, { subtasks }).catch((e) =>
          console.error("[v0] toggle subtask failed:", e)
        )
        return { ...t, subtasks }
      })
    )
  }, [supabase])

  // Rename a task title
  const handleUpdateTaskTitle = useCallback((id: string, title: string) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, title } : t)))
    updateTask(supabase, id, { title }).catch((e) =>
      console.error("[v0] rename task failed:", e)
    )
  }, [supabase])

  // Add a new task into the current selection
  const handleAddTask = useCallback((input: NewTaskInput) => {
    const userId = userIdRef.current
    if (!userId) return

    const base: Task = {
      id: `temp-${Date.now()}`,
      title: input.title,
      notes: input.notes ?? undefined,
      due: input.due,
      tag: input.tag ?? undefined,
      done: false,
      completedAt: null,
      subtasks: [],
      projectId: null,
      order: tasks.length,
    }
    // Place into the active list
    if (todoSelection.kind === "project") {
      base.projectId = todoSelection.id
    } else {
      switch (todoSelection.id) {
        case "today":
          if (!input.due) base.pinnedToday = true
          else base.due = input.due
          break
        case "someday":
          base.someday = true
          break
        case "upcoming":
          // keep provided due date; default to tomorrow if none
          if (!input.due) {
            const d = new Date(); d.setDate(d.getDate() + 1)
            base.due = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
          }
          break
        // inbox / anytime: leave as provided
      }
    }

    // Optimistic add, then reconcile with the db-generated row (real uuid).
    setTasks((prev) => [...prev, base])
    insertTask(supabase, userId, base)
      .then((created) => {
        setTasks((prev) => prev.map((t) => (t.id === base.id ? created : t)))
      })
      .catch((e) => {
        console.error("[v0] add task failed:", e)
        setTasks((prev) => prev.filter((t) => t.id !== base.id))
      })
  }, [todoSelection, tasks.length, supabase])

  // Create a new project
  const handleNewProject = useCallback(() => {
    const userId = userIdRef.current
    if (!userId) return
    const emojis = ["📁", "🚀", "📌", "🎯", "💡", "🌱", "📦", "⭐"]
    const draft = {
      name: "New Project",
      emoji: emojis[Math.floor(Math.random() * emojis.length)],
      headings: [],
    }
    insertProject(supabase, userId, draft)
      .then((created) => {
        setProjects((prev) => [...prev, created])
        setTodoSelection({ kind: "project", id: created.id })
      })
      .catch((e) => console.error("[v0] new project failed:", e))
  }, [supabase])

  // Derived state
  const inboxNotes = notes.filter((n) => n.inInbox)
  const regularNotes = notes.filter((n) => !n.inInbox)
  const activeNote = notes.find((n) => n.id === activeNoteId) ?? null

  // Build tag registry from all notes (both regular and inbox)
  const tagRegistry = useMemo(() => buildTagRegistry(notes), [notes])
  const tagList = useMemo(() => Array.from(tagRegistry.values()), [tagRegistry])

  // Existing tags for the hash-tag autocomplete
  const existingTagEntries: TagEntry[] = useMemo(() => tagList, [tagList])

  // Called when the editor commits a new #tag
  const handleTagCreated = useCallback((label: string) => {
    const color = getTagColor(label)
    const noteTag: NoteTag = {
      label,
      color: color.bgClass,
      textColor: color.textClass,
    }
    setNotes((prev) =>
      prev.map((n) => {
        if (n.id !== activeNoteId) return n
        if (n.tags.some((t) => t.label.toLowerCase() === label.toLowerCase())) return n
        const tags = [...n.tags, noteTag]
        updateNote(supabase, n.id, { tags }).catch((e) =>
          console.error("[v0] add tag failed:", e)
        )
        return { ...n, tags }
      })
    )
  }, [activeNoteId, supabase])

  // Rename a tag across all notes
  const handleRenameTag = useCallback((oldLabel: string, newLabel: string) => {
    const color = getTagColor(newLabel)
    setNotes((prev) =>
      prev.map((n) => {
        if (!n.tags.some((t) => t.label.toLowerCase() === oldLabel)) return n
        const tags = n.tags.map((t) =>
          t.label.toLowerCase() === oldLabel
            ? { label: newLabel, color: color.bgClass, textColor: color.textClass }
            : t
        )
        updateNote(supabase, n.id, { tags }).catch((e) =>
          console.error("[v0] rename tag failed:", e)
        )
        return { ...n, tags }
      })
    )
    if (activeFilterTag === oldLabel) setActiveFilterTag(newLabel.toLowerCase())
  }, [activeFilterTag, supabase])

  // Delete a tag from all notes
  const handleDeleteTag = useCallback((label: string) => {
    setNotes((prev) =>
      prev.map((n) => {
        if (!n.tags.some((t) => t.label.toLowerCase() === label)) return n
        const tags = n.tags.filter((t) => t.label.toLowerCase() !== label)
        updateNote(supabase, n.id, { tags }).catch((e) =>
          console.error("[v0] delete tag failed:", e)
        )
        return { ...n, tags }
      })
    )
    if (activeFilterTag === label) setActiveFilterTag(null)
  }, [activeFilterTag, supabase])

  // Cmd+K shortcut
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setCaptureOpen((prev) => !prev)
      }
      if ((e.metaKey || e.ctrlKey) && e.key === ",") {
        e.preventDefault()
        setSettingsOpen((prev) => !prev)
      }
      if (e.key === "Escape") {
        setCaptureOpen(false)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  // Debounced autosave from the editor (title / preview / content)
  const handleUpdate = useCallback((id: string, changes: NoteChanges) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, ...changes } : n))
    )
    updateNote(supabase, id, changes).catch((e) =>
      console.error("[v0] save note failed:", e)
    )
  }, [supabase])

  const handleNewNote = useCallback(() => {
    const userId = userIdRef.current
    if (!userId) return
    const tempId = `temp-${Date.now()}`
    const draft: Note = {
      id: tempId,
      title: "Untitled",
      preview: "",
      date: "Just now",
      tags: [],
      content: "<p></p>",
    }
    setNotes((prev) => [draft, ...prev])
    setActiveNoteId(tempId)
    setActiveNav("notes")

    insertNote(supabase, userId, { title: "Untitled", content: "<p></p>" })
      .then((created) => {
        setNotes((prev) => prev.map((n) => (n.id === tempId ? created : n)))
        setActiveNoteId(created.id)
      })
      .catch((e) => {
        console.error("[v0] new note failed:", e)
        setNotes((prev) => prev.filter((n) => n.id !== tempId))
      })
  }, [supabase])

  // Quick capture → goes to Inbox
  const handleCapture = useCallback((captured: CapturedNote) => {
    const userId = userIdRef.current
    if (!userId) return
    const tempId = `temp-${Date.now()}`
    const now = new Date()
    const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    const draft: Note = {
      id: tempId,
      title: captured.title,
      preview: "",
      date: `Today ${timeStr}`,
      tags: captured.tags,
      inInbox: true,
      content: "<p></p>",
    }
    setNotes((prev) => [draft, ...prev])
    setActiveNav("inbox")

    insertNote(supabase, userId, {
      title: captured.title,
      tags: captured.tags,
      isInbox: true,
    })
      .then((created) => {
        setNotes((prev) => prev.map((n) => (n.id === tempId ? created : n)))
      })
      .catch((e) => {
        console.error("[v0] capture failed:", e)
        setNotes((prev) => prev.filter((n) => n.id !== tempId))
      })
  }, [supabase])

  // Move a note from Inbox → Notes
  const handleMoveToNotes = useCallback((id: string) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, inInbox: false } : n))
    )
    updateNote(supabase, id, { isInbox: false }).catch((e) =>
      console.error("[v0] move to notes failed:", e)
    )
  }, [supabase])

  // Delete from inbox
  const handleDeleteInbox = useCallback((id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id))
    if (activeNoteId === id) setActiveNoteId(regularNotes[0]?.id ?? "")
    deleteNote(supabase, id).catch((e) =>
      console.error("[v0] delete note failed:", e)
    )
  }, [activeNoteId, regularNotes, supabase])

  // Open an inbox note in the editor
  const handleOpenInboxNote = useCallback((id: string) => {
    setActiveNoteId(id)
  }, [])

  if (loading) {
    return (
      <div
        className="flex h-full w-full items-center justify-center"
        style={{ backgroundColor: "#1C1C1E" }}
      >
        <div className="flex flex-col items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl"
            style={{ backgroundColor: "#D97B45" }}
          >
            <span
              aria-hidden="true"
              style={{ color: "#FAF9F7", fontSize: 18, fontWeight: 700, fontFamily: "Georgia, serif" }}
            >
              H
            </span>
          </div>
          <p style={{ color: "#6E6E73", fontSize: 13 }}>Loading your workspace…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full w-full overflow-hidden" style={{ backgroundColor: "#1C1C1E" }}>
      {/* Column 1 — Icon sidebar */}
      <IconSidebar
        active={activeNav}
        onSelect={setActiveNav}
        inboxCount={inboxNotes.length}
        onOpenSettings={() => setSettingsOpen(true)}
        settingsOpen={settingsOpen}
        onSignOut={handleSignOut}
      />

      {/* To-do mode takes over columns 2 + 3 */}
      {activeNav === "todos" ? (
        <>
          <TodoNavPanel
            tasks={tasks}
            projects={projects}
            selection={todoSelection}
            onSelect={setTodoSelection}
            onNewProject={handleNewProject}
          />
          <TodoListView
            selection={todoSelection}
            tasks={tasks}
            projects={projects}
            onToggleTask={handleToggleTask}
            onToggleSubtask={handleToggleSubtask}
            onAddTask={handleAddTask}
            onUpdateTitle={handleUpdateTaskTitle}
          />
        </>
      ) : (
        <>
      {/* Column 2 — Inbox, Tags panel, or Note list */}
      {activeNav === "inbox" ? (
        <InboxView
          notes={inboxNotes}
          onMoveToNotes={handleMoveToNotes}
          onDelete={handleDeleteInbox}
          onOpen={handleOpenInboxNote}
        />
      ) : activeNav === "tags" ? (
        <TagsPanel
          tags={tagList}
          activeTag={activeFilterTag}
          onSelectTag={(tag) => {
            setActiveFilterTag(tag)
            // Switch to Notes view to show filtered results
            setActiveNav("notes")
          }}
          onRenameTag={handleRenameTag}
          onDeleteTag={handleDeleteTag}
        />
      ) : (
        <NoteListPanel
          notes={regularNotes}
          activeId={activeNoteId}
          onSelect={setActiveNoteId}
          onNew={handleNewNote}
          filterTag={activeFilterTag}
        />
      )}

      {/* Column 3 — Editor */}
      <NoteEditor
        note={activeNote}
        onUpdate={handleUpdate}
        initialContent={activeNote?.content ?? undefined}
        existingTags={existingTagEntries}
        onTagCreated={handleTagCreated}
      />

      {/* Floating quick-capture button */}
      <button
        onClick={() => setCaptureOpen(true)}
        aria-label="Quick capture (Cmd+K)"
        className="quick-capture-fab"
        style={{
          position: "fixed",
          bottom: 28,
          right: 28,
          width: 44,
          height: 44,
          borderRadius: "50%",
          backgroundColor: "#D97B45",
          color: "#FFFFFF",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 14px rgba(217, 123, 69, 0.45)",
          zIndex: 100,
        }}
      >
        <Plus size={20} strokeWidth={2.5} aria-hidden="true" />
      </button>

      {/* Quick capture modal */}
      <QuickCaptureModal
        isOpen={captureOpen}
        onClose={() => setCaptureOpen(false)}
        onCapture={handleCapture}
      />
        </>
      )}

      {/* Settings modal (available from any view) */}
      <SettingsModal
        open={settingsOpen}
        settings={settings}
        onChange={setSettings}
        onClose={() => setSettingsOpen(false)}
        onReset={() => setSettings(DEFAULT_SETTINGS)}
      />
    </div>
  )
}
