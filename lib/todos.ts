// ─── To-do data layer (Things 3-style) ──────────────────────────────────────

export type SectionId =
  | "inbox"
  | "today"
  | "upcoming"
  | "anytime"
  | "someday"

export interface SubTask {
  id: string
  title: string
  done: boolean
}

export interface Task {
  id: string
  title: string
  notes?: string
  /** ISO date string (yyyy-mm-dd) or null for no date */
  due: string | null
  /** "today" means manually pulled into Today even without a due date */
  pinnedToday?: boolean
  tag?: string
  done: boolean
  completedAt?: number | null
  subtasks: SubTask[]
  /** id of the project this task belongs to, or null */
  projectId: string | null
  /** "someday" flag — no date, no urgency */
  someday?: boolean
  /** ordering within its list */
  order: number
}

export interface Heading {
  id: string
  title: string
  /** ordering within the project, interleaved with tasks via `order` */
  order: number
}

export interface Project {
  id: string
  name: string
  emoji?: string
  area?: string
  headings: Heading[]
}

// ─── Date helpers ────────────────────────────────────────────────────────────

export function todayISO(): string {
  return toISO(new Date())
}

export function toISO(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

export function parseISO(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number)
  return new Date(y, m - 1, d)
}

/** Days from today (negative = overdue, 0 = today, 1 = tomorrow) */
export function daysFromToday(iso: string): number {
  const today = parseISO(todayISO())
  const target = parseISO(iso)
  const diff = target.getTime() - today.getTime()
  return Math.round(diff / (1000 * 60 * 60 * 24))
}

export function isOverdue(iso: string | null): boolean {
  if (!iso) return false
  return daysFromToday(iso) < 0
}

export function isToday(iso: string | null): boolean {
  if (!iso) return false
  return daysFromToday(iso) === 0
}

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

/** Big header date e.g. "Thursday · June 25" */
export function formatLongDate(d: Date): string {
  return `${WEEKDAYS[d.getDay()]} · ${MONTHS[d.getMonth()]} ${d.getDate()}`
}

/** Short due-date label shown on a task row */
export function formatDueLabel(iso: string): string {
  const diff = daysFromToday(iso)
  const d = parseISO(iso)
  if (diff === 0) return "Today"
  if (diff === 1) return "Tomorrow"
  if (diff === -1) return "Yesterday"
  if (diff < 0) return `${MONTHS_SHORT[d.getMonth()]} ${d.getDate()}`
  if (diff < 7) return WEEKDAYS[d.getDay()]
  return `${MONTHS_SHORT[d.getMonth()]} ${d.getDate()}`
}

/** Grouping label for the Upcoming list, e.g. "Tomorrow", "Friday June 27", "Next Week" */
export function upcomingGroupLabel(iso: string): string {
  const diff = daysFromToday(iso)
  const d = parseISO(iso)
  if (diff === 1) return "Tomorrow"
  if (diff <= 6) return `${WEEKDAYS[d.getDay()]} ${MONTHS[d.getMonth()]} ${d.getDate()}`
  if (diff <= 13) return "Next Week"
  if (diff <= 30) return "This Month"
  return "Later"
}

// ─── Section assignment ──────────────────────────────────────────────────────

/** Which built-in section a task belongs to (ignores completion state) */
export function taskMatchesSection(task: Task, section: SectionId): boolean {
  switch (section) {
    case "inbox":
      // Uncategorized: no project, no date, not someday
      return !task.projectId && !task.due && !task.someday && !task.pinnedToday
    case "today":
      return task.pinnedToday === true || isToday(task.due) || isOverdue(task.due)
    case "upcoming":
      return !!task.due && daysFromToday(task.due) > 0
    case "anytime":
      // No date, assigned to a project
      return !task.due && !task.someday && !!task.projectId
    case "someday":
      return task.someday === true && !task.due
    default:
      return false
  }
}

export function countSection(tasks: Task[], section: SectionId): number {
  return tasks.filter((t) => !t.done && taskMatchesSection(t, section)).length
}

// ─── Seed data ───────────────────────────────────────────────────────────────

function offsetISO(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return toISO(d)
}

export const INITIAL_PROJECTS: Project[] = [
  {
    id: "proj-redesign",
    name: "App Redesign",
    emoji: "🎨",
    area: "Work",
    headings: [
      { id: "h-research", title: "Research", order: 0 },
      { id: "h-build", title: "Build", order: 3 },
    ],
  },
  {
    id: "proj-lisbon",
    name: "Lisbon Trip",
    emoji: "✈️",
    area: "Personal",
    headings: [],
  },
]

export const INITIAL_TASKS: Task[] = [
  // Today (due today)
  {
    id: "t1", title: "Review onboarding redesign feedback", due: todayISO(),
    done: false, subtasks: [], projectId: null, order: 0,
  },
  {
    id: "t2", title: "Reply to design team thread", due: todayISO(), tag: "Work",
    done: false, subtasks: [
      { id: "s1", title: "Read the Figma comments", done: true },
      { id: "s2", title: "Summarize decisions", done: false },
    ], projectId: null, order: 1,
  },
  // Overdue (shows in Today, red)
  {
    id: "t3", title: "Submit expense report", due: offsetISO(-2), tag: "Work",
    done: false, subtasks: [], projectId: null, order: 2,
  },
  // Pinned to today (no due date)
  {
    id: "t4", title: "Call the dentist", pinnedToday: true, due: null,
    done: false, subtasks: [], projectId: null, order: 3,
  },
  // Upcoming
  {
    id: "t5", title: "Prepare sprint planning deck", due: offsetISO(1), tag: "Work",
    done: false, subtasks: [], projectId: "proj-redesign", order: 0,
  },
  {
    id: "t6", title: "Dinner reservation for anniversary", due: offsetISO(3),
    done: false, subtasks: [], projectId: null, order: 1,
  },
  {
    id: "t7", title: "Quarterly review with manager", due: offsetISO(9), tag: "Work",
    done: false, subtasks: [], projectId: null, order: 2,
  },
  {
    id: "t8", title: "Renew passport", due: offsetISO(20),
    done: false, subtasks: [], projectId: "proj-lisbon", order: 3,
  },
  // Inbox (uncategorized)
  {
    id: "t9", title: "Look into noise-cancelling headphones", due: null,
    done: false, subtasks: [], projectId: null, order: 0,
  },
  {
    id: "t10", title: "Idea: weekend pottery class", due: null,
    done: false, subtasks: [], projectId: null, order: 1,
  },
  // Anytime (project, no date)
  {
    id: "t11", title: "Audit current component library", due: null, tag: "Work",
    done: false, subtasks: [], projectId: "proj-redesign", order: 1,
  },
  {
    id: "t12", title: "Collect competitor screenshots", due: null,
    done: false, subtasks: [], projectId: "proj-redesign", order: 2,
  },
  {
    id: "t13", title: "Book accommodation in Alfama", due: null,
    done: false, subtasks: [], projectId: "proj-lisbon", order: 0,
  },
  // Someday
  {
    id: "t14", title: "Learn film photography", due: null, someday: true,
    done: false, subtasks: [], projectId: null, order: 0,
  },
  {
    id: "t15", title: "Read 'The Pragmatic Programmer'", due: null, someday: true,
    done: false, subtasks: [], projectId: null, order: 1,
  },
  // A couple already-completed for the "Show Completed" toggle
  {
    id: "t16", title: "Ship the new landing page", due: todayISO(),
    done: true, completedAt: Date.now() - 3600_000, subtasks: [], projectId: null, order: 4,
  },
]
