-- ─────────────────────────────────────────────────────────────────────────────
-- Row Level Security (RLS) policies for Hagba
-- ─────────────────────────────────────────────────────────────────────────────
-- The app's entire authorization model lives here. The Next.js client talks to
-- Supabase directly with the anon key, so per-user isolation is enforced ONLY by
-- these policies — not by application code. Apply this in the Supabase SQL editor
-- (or via `supabase db push`).
--
-- Model:
--   * Every row is owned by `user_id = auth.uid()`.
--   * Owners get full CRUD on their own rows.
--   * Public notes (`is_public = true`) are readable by anyone (incl. anon) so
--     the `/share/[id]` page works for logged-out visitors.
--   * The `avatars` storage bucket only lets a user write under their own
--     `<uid>/...` prefix.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── notes ────────────────────────────────────────────────────────────────────
alter table public.notes enable row level security;

drop policy if exists notes_select_own    on public.notes;
drop policy if exists notes_select_public on public.notes;
drop policy if exists notes_insert_own    on public.notes;
drop policy if exists notes_update_own    on public.notes;
drop policy if exists notes_delete_own    on public.notes;

create policy notes_select_own on public.notes
  for select using (auth.uid() = user_id);

-- Public read-only access for shared notes (anon + authenticated).
create policy notes_select_public on public.notes
  for select using (is_public = true);

create policy notes_insert_own on public.notes
  for insert with check (auth.uid() = user_id);

create policy notes_update_own on public.notes
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy notes_delete_own on public.notes
  for delete using (auth.uid() = user_id);

-- ── tasks ────────────────────────────────────────────────────────────────────
alter table public.tasks enable row level security;

drop policy if exists tasks_select_own on public.tasks;
drop policy if exists tasks_insert_own on public.tasks;
drop policy if exists tasks_update_own on public.tasks;
drop policy if exists tasks_delete_own on public.tasks;

create policy tasks_select_own on public.tasks
  for select using (auth.uid() = user_id);

create policy tasks_insert_own on public.tasks
  for insert with check (auth.uid() = user_id);

create policy tasks_update_own on public.tasks
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy tasks_delete_own on public.tasks
  for delete using (auth.uid() = user_id);

-- ── projects ─────────────────────────────────────────────────────────────────
alter table public.projects enable row level security;

drop policy if exists projects_select_own on public.projects;
drop policy if exists projects_insert_own on public.projects;
drop policy if exists projects_update_own on public.projects;
drop policy if exists projects_delete_own on public.projects;

create policy projects_select_own on public.projects
  for select using (auth.uid() = user_id);

create policy projects_insert_own on public.projects
  for insert with check (auth.uid() = user_id);

create policy projects_update_own on public.projects
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy projects_delete_own on public.projects
  for delete using (auth.uid() = user_id);

-- ── user_settings ────────────────────────────────────────────────────────────
alter table public.user_settings enable row level security;

drop policy if exists user_settings_select_own on public.user_settings;
drop policy if exists user_settings_insert_own on public.user_settings;
drop policy if exists user_settings_update_own on public.user_settings;
drop policy if exists user_settings_delete_own on public.user_settings;

create policy user_settings_select_own on public.user_settings
  for select using (auth.uid() = user_id);

create policy user_settings_insert_own on public.user_settings
  for insert with check (auth.uid() = user_id);

create policy user_settings_update_own on public.user_settings
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy user_settings_delete_own on public.user_settings
  for delete using (auth.uid() = user_id);

-- ── storage: avatars bucket ──────────────────────────────────────────────────
-- Avatars are uploaded to `<uid>/avatar-<ts>.<ext>` (see lib/db.ts:uploadAvatar)
-- and served via public URL. Reads are public; writes/deletes are restricted to
-- the owner's own folder. `storage.foldername(name)[1]` is the first path
-- segment, i.e. the owning user's id.
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists avatars_read_public  on storage.objects;
drop policy if exists avatars_insert_own   on storage.objects;
drop policy if exists avatars_update_own   on storage.objects;
drop policy if exists avatars_delete_own   on storage.objects;

create policy avatars_read_public on storage.objects
  for select using (bucket_id = 'avatars');

create policy avatars_insert_own on storage.objects
  for insert with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy avatars_update_own on storage.objects
  for update using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy avatars_delete_own on storage.objects
  for delete using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
