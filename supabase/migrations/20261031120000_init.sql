-- AJU BOT schema for Supabase.
-- Applied automatically by the Supabase GitHub integration on push to main,
-- or run by hand in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
-- Safe to re-run.

create table if not exists public.faculty (
  id               text primary key,
  name             text not null,
  email            text not null unique,
  position         text not null,
  designation      text,
  department       text not null,
  dept_short       text not null,
  phone            text,
  employee_code    text unique,
  cabin            text,
  joined_on        date,
  avatar_initials  text not null,
  current_section  text not null default 'Not assigned',
  timetable        jsonb not null default '[]'::jsonb,
  subjects         jsonb not null default '[]'::jsonb,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create table if not exists public.leave_requests (
  id             text primary key,
  faculty_id     text not null references public.faculty(id) on delete cascade,
  faculty_name   text not null,
  department     text not null,
  dept_short     text not null,
  leave_type     text,
  from_date      date not null,
  to_date        date not null,
  days_count     integer not null,
  reason         text not null,
  substitutions  jsonb not null default '[]'::jsonb,
  status         text not null default 'Pending' check (status in ('Pending', 'Approved', 'Rejected')),
  created_at     text not null,
  reviewed_at    text,
  updated_at     timestamptz not null default now()
);

create index if not exists leave_requests_faculty_id_idx on public.leave_requests (faculty_id);

-- Keep updated_at current on every write
create or replace function public.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists faculty_touch on public.faculty;
create trigger faculty_touch before update on public.faculty
  for each row execute function public.touch_updated_at();

drop trigger if exists leave_requests_touch on public.leave_requests;
create trigger leave_requests_touch before update on public.leave_requests
  for each row execute function public.touch_updated_at();

-- Row Level Security.
-- The app has no Supabase Auth yet (it uses the shared institution password),
-- so the browser talks to the database as the "anon" role. These policies let
-- the app read, add and update rows, but never delete them.
-- Replace with per-user policies once Supabase Auth is added.
alter table public.faculty enable row level security;
alter table public.leave_requests enable row level security;

drop policy if exists "app can read faculty" on public.faculty;
create policy "app can read faculty" on public.faculty for select to anon, authenticated using (true);
drop policy if exists "app can add faculty" on public.faculty;
create policy "app can add faculty" on public.faculty for insert to anon, authenticated with check (true);
drop policy if exists "app can update faculty" on public.faculty;
create policy "app can update faculty" on public.faculty for update to anon, authenticated using (true) with check (true);

drop policy if exists "app can read leave" on public.leave_requests;
create policy "app can read leave" on public.leave_requests for select to anon, authenticated using (true);
drop policy if exists "app can add leave" on public.leave_requests;
create policy "app can add leave" on public.leave_requests for insert to anon, authenticated with check (true);
drop policy if exists "app can update leave" on public.leave_requests;
create policy "app can update leave" on public.leave_requests for update to anon, authenticated using (true) with check (true);

grant select, insert, update on public.faculty, public.leave_requests to anon, authenticated;
