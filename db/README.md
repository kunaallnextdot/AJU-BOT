# AJU BOT – Database

Files
- `schema.sql` – tables, constraints, indexes, dashboard views (SQLite syntax)
- `seed.sql` – data: 10 faculty, 12 courses, full timetable, one week of sessions/presence, syllabus, leave, substitutions, feedback
- `aju_bot.db` – ready-to-use SQLite file (schema + seed already loaded)
- `build_seed.py` – regenerates `seed.sql` and `aju_bot.db` (`python3 build_seed.py`)
- `export_frontend.py` – snapshots `aju_bot.db` into `src/data/ajuData.ts` for the React app

## How the website uses this database
The app is a static Vite/React site with no API server yet, so the database is
the source of truth and `export_frontend.py` turns it into typed data the UI imports.
After changing seed data:

```bash
cd db
python3 build_seed.py        # rebuild seed.sql + aju_bot.db
python3 export_frontend.py   # rewrite src/data/ajuData.ts
```

| Table / view | Where it shows up |
|---|---|
| `faculty`, `departments`, `rooms` (cabins) | Faculty Directory, profile drawer, login |
| `users` | Login: admin = `admin` / `admin@aju.example`, faculty = full name or their email |
| `timetable_slots`, `periods`, `sections`, `course_assignments` | Timetable (P1–P6), My Day, live "In class now" |
| `syllabus_units`, `syllabus_progress` | Syllabus units with status + % (faculty can tick units) |
| `leave_requests`, `substitution_requests` | Leave & Substitution (leave type, per-substitution status, review note) |
| `class_sessions` | Admin "Classes this week" chart, attendance %, cancelled/substituted notes |
| `faculty_presence` | Admin "Campus presence", check-in/out on faculty cards |
| `course_feedback_status` (`v_feedback_list`) | Admin "Course feedback", faculty course badges |

Changes made in the browser (approving leave, ticking units, new leave) are kept in
`localStorage` (keys prefixed `aju_v2_`), not written back to SQLite. Writing back
needs an API server and a hosted database (see the Postgres notes below).

## What is real vs. sample
| Source | Data |
|---|---|
| **From your screenshots** | 5 teachers (Dilip Kumar, Megha Sinha, Mamatha Vayelapelli, Chandra Prabha Sahu, Sayantani De), 7 course codes + titles + categories, the Sem 7 timetable (P1–P5, Mon–Fri), period start times, feedback "Done" list |
| **Added by me (`source='sample'`)** | Teachers 6–10, their 5 courses, 2 extra sections, emails/phones, credits, rooms, designations, syllabus units, presence, sessions, leave/substitution rows, ratings |

Period end times are assumed (45 min each). The Minor Project teacher is Mamatha (from the timetable); Summer Internship-II has no teacher in the screenshots, so Anita Sharma is the sample coordinator.

## Relationships
```
departments 1─* faculty 1─1 users
departments 1─* courses
sections 1─* course_assignments *─1 courses         (course_assignments.faculty_id → faculty)
course_assignments 1─* timetable_slots *─1 periods, rooms
timetable_slots 1─* class_sessions                   (live class tracking, per date)
timetable_slots 1─* substitution_requests            (per date)
faculty 1─* faculty_presence | leave_requests
courses 1─* syllabus_units 1─* syllabus_progress *─1 course_assignments
course_assignments 1─1 course_feedback_status
```
`timetable_slots` has UNIQUE constraints so the DB rejects a teacher, section, or room being double-booked.

## Views for the frontend
`v_course_dropdown`, `v_timetable_grid`, `v_faculty_weekly_load`, `v_syllabus_completion`, `v_feedback_list`

## Handy queries
```sql
-- Who is on campus right now / today
SELECT f.full_name, p.status, p.check_in, p.check_out, r.code AS location
FROM faculty_presence p JOIN faculty f ON f.id = p.faculty_id
LEFT JOIN rooms r ON r.id = p.current_room_id
WHERE p.presence_date = :today;

-- Classes happening now
SELECT * FROM v_timetable_grid
WHERE day_of_week = :day AND start_time <= :now AND end_time > :now;

-- Free teachers in a period (for choosing a substitute)
SELECT f.* FROM faculty f WHERE f.is_active = 1 AND f.id NOT IN
 (SELECT faculty_id FROM timetable_slots WHERE day_of_week = :day AND period_id = :period);

-- Pending approvals
SELECT * FROM substitution_requests WHERE status = 'pending';
SELECT * FROM leave_requests WHERE status = 'pending';
```

## Moving to Postgres / MySQL (e.g. for Vercel)
- Replace `INTEGER PRIMARY KEY AUTOINCREMENT` with `SERIAL PRIMARY KEY` (Postgres, e.g. Neon/Supabase) or `INT AUTO_INCREMENT PRIMARY KEY` (MySQL).
- Remove `PRAGMA foreign_keys = ON;`.
- Change `TEXT` date/time columns to `DATE` / `TIME` / `TIMESTAMP` if you prefer real types.
- In Postgres, `SUM(sp.status = 'completed')` needs `SUM((sp.status = 'completed')::int)`.
- Vercel's filesystem is read-only/ephemeral, so don't use the `.db` file in production there; use a hosted database.
- Replace `REPLACE_WITH_BCRYPT_HASH` in `users` with real password hashes before use.
