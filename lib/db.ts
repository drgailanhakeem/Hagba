// ─── Supabase data access layer ──────────────────────────────────────────────
// Maps between database rows (snake_case) and the app's domain types.

import type { SupabaseClient } from "@supabase/supabase-js"
import type { Note, NoteTag } from "@/components/note-list-panel"
import type { Task, Project } from "@/lib/todos"

// ── Row shapes ───────────────────────────────────────────────────────────────

interface NoteRow {
  id: string
  user_id: string
  title: string
  content: string
  preview: string
  tags: NoteTag[]
  is_inbox: boolean
  is_favorite: boolean
  created_at: string
  updated_at: string
}

interface TaskRow {
  id: string
  user_id: string
  title: string
  notes: string | null
  due: string | null
  pinned_today: boolean
  tag: string | null
  done: boolean
  completed_at: number | null
  subtasks: Task["subtasks"]
  project_id: string | null
  someday: boolean
  sort_order: number
  created_at: string
}

interface ProjectRow {
  id: string
  user_id: string
  name: string
  emoji: string | null
  area: string | null
  headings: Project["headings"]
  created_at: string
}

// ── User settings ─────────────────────────────────────────────────────────────

export interface UserSettings {
  displayName: string
  avatarUrl: string | null
  fontSize: "small" | "medium" | "large"
  editorFont: "serif" | "sans"
  accentColor: string
  pomodoroFocus: number
  pomodoroShortBreak: number
  pomodoroLongBreak: number
  soundEnabled: boolean
}

export const DEFAULT_USER_SETTINGS: UserSettings = {
  displayName: "",
  avatarUrl: null,
  fontSize: "medium",
  editorFont: "serif",
  accentColor: "#D97B45",
  pomodoroFocus: 25,
  pomodoroShortBreak: 5,
  pomodoroLongBreak: 15,
  soundEnabled: true,
}

interface UserSettingsRow {
  user_id: string
  display_name: string
  avatar_url: string | null
  font_size: string
  editor_font: string
  accent_color: string
  pomodoro_focus: number
  pomodoro_short_break: number
  pomodoro_long_break: number
  sound_enabled: boolean
}

function rowToSettings(row: UserSettingsRow): UserSettings {
  return {
    displayName: row.display_name ?? "",
    avatarUrl: row.avatar_url ?? null,
    fontSize: (["small", "medium", "large"].includes(row.font_size) ? row.font_size : "medium") as UserSettings["fontSize"],
    editorFont: (row.editor_font === "sans" ? "sans" : "serif") as UserSettings["editorFont"],
    accentColor: row.accent_color ?? "#D97B45",
    pomodoroFocus: row.pomodoro_focus ?? 25,
    pomodoroShortBreak: row.pomodoro_short_break ?? 5,
    pomodoroLongBreak: row.pomodoro_long_break ?? 15,
    soundEnabled: row.sound_enabled ?? true,
  }
}

/** Fetch the signed-in user's settings, or null when no row exists yet. */
export async function fetchUserSettings(db: DB, userId: string): Promise<UserSettings | null> {
  const { data, error } = await db
    .from("user_settings")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  return rowToSettings(data as UserSettingsRow)
}

/** Insert or update the user's settings row. */
export async function upsertUserSettings(db: DB, userId: string, s: UserSettings): Promise<void> {
  const { error } = await db.from("user_settings").upsert(
    {
      user_id: userId,
      display_name: s.displayName,
      avatar_url: s.avatarUrl,
      font_size: s.fontSize,
      editor_font: s.editorFont,
      accent_color: s.accentColor,
      pomodoro_focus: s.pomodoroFocus,
      pomodoro_short_break: s.pomodoroShortBreak,
      pomodoro_long_break: s.pomodoroLongBreak,
      sound_enabled: s.soundEnabled,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  )
  if (error) throw error
}

/** Upload an avatar image to the "avatars" bucket and return its public URL. */
export async function uploadAvatar(db: DB, userId: string, file: File): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "png"
  const path = `${userId}/avatar-${Date.now()}.${ext}`
  const { error } = await db.storage
    .from("avatars")
    .upload(path, file, { upsert: true, contentType: file.type || "image/png" })
  if (error) throw error
  const { data } = db.storage.from("avatars").getPublicUrl(path)
  return data.publicUrl
}

// ── Date formatting for the note list / editor footer ───────────────────────

export function formatNoteDate(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const startOfDay = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime()
  const dayDiff = Math.round((startOfDay(now) - startOfDay(d)) / 86_400_000)
  const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })

  if (dayDiff === 0) return `Today ${time}`
  if (dayDiff === 1) return "Yesterday"
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  if (d.getFullYear() === now.getFullYear()) return `${months[d.getMonth()]} ${d.getDate()}`
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
}

// ── Mappers ──────────────────────────────────────────────────────────────────

function rowToNote(row: NoteRow): Note {
  return {
    id: row.id,
    title: row.title,
    preview: row.preview,
    date: formatNoteDate(row.updated_at ?? row.created_at),
    tags: Array.isArray(row.tags) ? row.tags : [],
    inInbox: row.is_inbox,
    isFavorite: row.is_favorite ?? false,
    content: row.content,
  }
}

function rowToTask(row: TaskRow): Task {
  return {
    id: row.id,
    title: row.title,
    notes: row.notes ?? undefined,
    due: row.due,
    pinnedToday: row.pinned_today,
    tag: row.tag ?? undefined,
    done: row.done,
    completedAt: row.completed_at,
    subtasks: Array.isArray(row.subtasks) ? row.subtasks : [],
    projectId: row.project_id,
    someday: row.someday,
    order: row.sort_order,
  }
}

function rowToProject(row: ProjectRow): Project {
  return {
    id: row.id,
    name: row.name,
    emoji: row.emoji ?? undefined,
    area: row.area ?? undefined,
    headings: Array.isArray(row.headings) ? row.headings : [],
  }
}

type DB = SupabaseClient

// ── Notes ────────────────────────────────────────────────────────────────────

export async function fetchNotes(db: DB): Promise<Note[]> {
  const { data, error } = await db
    .from("notes")
    .select("*")
    .order("updated_at", { ascending: false })
  if (error) throw error
  return (data as NoteRow[]).map(rowToNote)
}

export async function insertNote(
  db: DB,
  userId: string,
  note: { title: string; content?: string; preview?: string; tags?: NoteTag[]; isInbox?: boolean; isFavorite?: boolean },
): Promise<Note> {
  const { data, error } = await db
    .from("notes")
    .insert({
      user_id: userId,
      title: note.title,
      content: note.content ?? "<p></p>",
      preview: note.preview ?? "",
      tags: note.tags ?? [],
      is_inbox: note.isInbox ?? false,
      is_favorite: note.isFavorite ?? false,
    })
    .select("*")
    .single()
  if (error) throw error
  return rowToNote(data as NoteRow)
}

export async function updateNote(
  db: DB,
  id: string,
  changes: { title?: string; content?: string; preview?: string; tags?: NoteTag[]; isInbox?: boolean; isFavorite?: boolean },
): Promise<void> {
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (changes.title !== undefined) patch.title = changes.title
  if (changes.content !== undefined) patch.content = changes.content
  if (changes.preview !== undefined) patch.preview = changes.preview
  if (changes.tags !== undefined) patch.tags = changes.tags
  if (changes.isInbox !== undefined) patch.is_inbox = changes.isInbox
  if (changes.isFavorite !== undefined) patch.is_favorite = changes.isFavorite

  const { error } = await db.from("notes").update(patch).eq("id", id)
  if (error) throw error
}

export async function deleteNote(db: DB, id: string): Promise<void> {
  const { error } = await db.from("notes").delete().eq("id", id)
  if (error) throw error
}

// ── Tasks ────────────────────────────────────────────────────────────────────

export async function fetchTasks(db: DB): Promise<Task[]> {
  const { data, error } = await db
    .from("tasks")
    .select("*")
    .order("sort_order", { ascending: true })
  if (error) throw error
  return (data as TaskRow[]).map(rowToTask)
}

export async function insertTask(db: DB, userId: string, task: Task): Promise<Task> {
  const { data, error } = await db
    .from("tasks")
    .insert(taskToRow(task, userId))
    .select("*")
    .single()
  if (error) throw error
  return rowToTask(data as TaskRow)
}

export async function updateTask(db: DB, id: string, changes: Partial<Task>): Promise<void> {
  const patch: Record<string, unknown> = {}
  if (changes.title !== undefined) patch.title = changes.title
  if (changes.notes !== undefined) patch.notes = changes.notes ?? null
  if (changes.due !== undefined) patch.due = changes.due
  if (changes.pinnedToday !== undefined) patch.pinned_today = changes.pinnedToday
  if (changes.tag !== undefined) patch.tag = changes.tag ?? null
  if (changes.done !== undefined) patch.done = changes.done
  if (changes.completedAt !== undefined) patch.completed_at = changes.completedAt
  if (changes.subtasks !== undefined) patch.subtasks = changes.subtasks
  if (changes.projectId !== undefined) patch.project_id = changes.projectId
  if (changes.someday !== undefined) patch.someday = changes.someday
  if (changes.order !== undefined) patch.sort_order = changes.order

  const { error } = await db.from("tasks").update(patch).eq("id", id)
  if (error) throw error
}

export async function deleteTask(db: DB, id: string): Promise<void> {
  const { error } = await db.from("tasks").delete().eq("id", id)
  if (error) throw error
}

function taskToRow(task: Task, userId: string) {
  return {
    user_id: userId,
    title: task.title,
    notes: task.notes ?? null,
    due: task.due,
    pinned_today: task.pinnedToday ?? false,
    tag: task.tag ?? null,
    done: task.done,
    completed_at: task.completedAt ?? null,
    subtasks: task.subtasks ?? [],
    project_id: task.projectId,
    someday: task.someday ?? false,
    sort_order: task.order,
  }
}

// ── Projects ─────────────────────────────────────────────────────────────────

export async function fetchProjects(db: DB): Promise<Project[]> {
  const { data, error } = await db
    .from("projects")
    .select("*")
    .order("created_at", { ascending: true })
  if (error) throw error
  return (data as ProjectRow[]).map(rowToProject)
}

export async function insertProject(db: DB, userId: string, project: Omit<Project, "id">): Promise<Project> {
  const { data, error } = await db
    .from("projects")
    .insert({
      user_id: userId,
      name: project.name,
      emoji: project.emoji ?? null,
      area: project.area ?? null,
      headings: project.headings ?? [],
    })
    .select("*")
    .single()
  if (error) throw error
  return rowToProject(data as ProjectRow)
}

export async function updateProject(
  db: DB,
  id: string,
  changes: { name?: string; emoji?: string | null; area?: string | null },
): Promise<void> {
  const patch: Record<string, unknown> = {}
  if (changes.name !== undefined) patch.name = changes.name
  if (changes.emoji !== undefined) patch.emoji = changes.emoji
  if (changes.area !== undefined) patch.area = changes.area
  const { error } = await db.from("projects").update(patch).eq("id", id)
  if (error) throw error
}

/** Delete a project. Tasks are kept but detached (project_id set to null). */
export async function deleteProject(db: DB, id: string): Promise<void> {
  const { error: detachError } = await db
    .from("tasks")
    .update({ project_id: null })
    .eq("project_id", id)
  if (detachError) throw detachError
  const { error } = await db.from("projects").delete().eq("id", id)
  if (error) throw error
}

// ── First-run seeding ─────────────────────────────────────────────────────────
// Inserts demo content the first time a user signs in (when everything is empty),
// preserving the original out-of-the-box experience. Remaps seed ids to db uuids
// so task→project references stay intact.

export async function seedInitialData(
  db: DB,
  userId: string,
  seed: {
    notes: Array<{ note: Omit<Note, "id" | "date">; content: string }>
    projects: Array<Omit<Project, "id"> & { seedId: string }>
    tasks: Task[]
  },
): Promise<{ notes: Note[]; projects: Project[]; tasks: Task[] }> {
  // Projects first, to build the id remap.
  const projectIdMap = new Map<string, string>()
  const insertedProjects: Project[] = []
  for (const p of seed.projects) {
    const created = await insertProject(db, userId, {
      name: p.name,
      emoji: p.emoji,
      area: p.area,
      headings: p.headings,
    })
    projectIdMap.set(p.seedId, created.id)
    insertedProjects.push(created)
  }

  // Tasks (remap projectId), inserted in a single batch.
  const taskRows = seed.tasks.map((t) =>
    taskToRow(
      { ...t, projectId: t.projectId ? projectIdMap.get(t.projectId) ?? null : null },
      userId,
    ),
  )
  let insertedTasks: Task[] = []
  if (taskRows.length > 0) {
    const { data, error } = await db.from("tasks").insert(taskRows).select("*")
    if (error) throw error
    insertedTasks = (data as TaskRow[]).map(rowToTask)
  }

  // Notes batch.
  const noteRows = seed.notes.map(({ note, content }) => ({
    user_id: userId,
    title: note.title,
    content,
    preview: note.preview,
    tags: note.tags ?? [],
    is_inbox: note.inInbox ?? false,
  }))
  let insertedNotes: Note[] = []
  if (noteRows.length > 0) {
    const { data, error } = await db
      .from("notes")
      .insert(noteRows)
      .select("*")
    if (error) throw error
    insertedNotes = (data as NoteRow[]).map(rowToNote)
  }

  return { notes: insertedNotes, projects: insertedProjects, tasks: insertedTasks }
}
