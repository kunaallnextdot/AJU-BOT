# AJU BOT

Faculty and admin academic operations app: live class status, timetable, syllabus tracking,
leave with peer substitution, and the holiday calendar.

React 19 + Vite + Tailwind on the frontend, Supabase (Postgres) as the database. There is no
separate API server: the browser talks to Supabase with the publishable key, and the rules that
must hold for everyone (who reviews a leave, overlapping dates, status changes) live in the
database as triggers.

## Setup

1. `npm install`
2. Copy `.env.example` to `.env` and fill in the values from Supabase → Settings → API.
   Only the two `VITE_` values go into Vercel. The secret key stays on your machine.
3. In the Supabase SQL Editor, run every file in `supabase/migrations/` in name order (each is safe to re-run).
4. `npm run db:seed` adds the sample data from `db/aju_bot.db` (it never overwrites existing rows).
5. `npm run dev` → http://localhost:3000

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Dev server on port 3000 |
| `npm run build` | Production build into `dist/` |
| `npm run lint` | Type check |
| `npm test` | Unit tests for leave routing and date rules |
| `npm run db:seed` | Add seed data to Supabase (needs `SUPABASE_SERVICE_ROLE_KEY`) |

## Where data lives

| Data | Source |
|---|---|
| Faculty, timetable, syllabus, leave requests | Supabase `faculty`, `leave_requests` |
| Admin accounts and leave routing | Supabase `admins` (`departments` null = reviews every department) |
| Holiday calendar | Supabase `holidays` |
| Presence, class sessions, course feedback | Bundled sample snapshot from `db/aju_bot.db` (read-only) |

If Supabase is unreachable the app shows **Offline data** in the top bar and runs on the bundled
snapshot. Leave requests and new faculty made offline are uploaded when the connection returns.

To change who reviews leave, edit the `admins` table in the Supabase dashboard. The leave form shows
the recipient the database will assign.

## Known limits

- Sign-in is a shared institution password checked in the browser. The database cannot tell users
  apart yet, so per-user permissions need Supabase Auth.
