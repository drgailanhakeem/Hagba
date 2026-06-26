# Hagba

A Bear/Things-style notes and tasks app built with **Next.js** (App Router), **Supabase** (auth, Postgres, storage), and a **TipTap** rich-text editor.

## Features

- Rich-text notes with slash commands, code blocks, task lists, and hashtag tags
- Things-style to-dos: Inbox / Today / Upcoming / Anytime / Someday, projects, subtasks
- Public read-only note sharing via `/share/[id]`
- Pomodoro timer, quick capture, per-user settings and avatars

## Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) project
- [pnpm](https://pnpm.io) (recommended)

## Getting started

1. **Install dependencies**

   ```bash
   pnpm install
   ```

2. **Configure environment variables**

   Copy the example file and fill in your Supabase credentials (Settings → API):

   ```bash
   cp .env.example .env.local
   ```

   | Variable | Scope | Notes |
   | --- | --- | --- |
   | `NEXT_PUBLIC_SUPABASE_URL` | public | Project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | public | Anon/publishable key |
   | `SUPABASE_SERVICE_ROLE_KEY` | **server only** | Admin key. **Never** prefix with `NEXT_PUBLIC_` — it bypasses RLS and would be exposed in the client bundle. |

3. **Apply the database policies**

   Authorization is enforced entirely by Postgres Row Level Security. Run the
   migration in `supabase/migrations/0001_rls_policies.sql` against your project
   (Supabase SQL editor, or `supabase db push`). It enables RLS, restricts every
   table to its owner, allows public read of shared notes, and locks the
   `avatars` storage bucket to each user's own folder.

4. **Run the dev server**

   ```bash
   pnpm dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Scripts

```bash
pnpm dev        # start the dev server
pnpm build      # production build
pnpm start      # serve the production build
pnpm lint       # eslint
pnpm typecheck  # tsc --noEmit (also enforced during build)
```

## Security notes

- **Public share pages** render note HTML through `lib/sanitize-note.ts`, which
  strips scripts, event handlers, and unsafe URL schemes before rendering.
- **The service-role key** is isolated in `lib/supabase/env.server.ts` and only
  ever read from a non-public env var.
- **All per-user access control** lives in the RLS policies (step 3); the client
  talks to Supabase directly, so these policies are the security boundary.

## Project structure

```
app/            Next.js routes (auth, share, account API, main page)
components/      UI, editor (TipTap), panels, modals
lib/            Data access (Supabase), domain logic, sanitization, helpers
supabase/       SQL migrations (RLS policies)
```
