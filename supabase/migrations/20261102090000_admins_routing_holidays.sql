-- Admin accounts, leave routing, holiday calendar and server-side leave rules.
-- Run once in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
-- Safe to re-run. Adds tables/columns only; no existing rows are deleted.

-- ---------- admins ----------
-- Who reviews leave. `departments` lists the dept_short codes an admin handles;
-- null means every department. Requests go to the most specific active admin.
create table if not exists public.admins (
  id               text primary key,
  name             text not null,
  email            text not null unique,
  position         text not null,
  avatar_initials  text not null,
  departments      text[],
  is_active        boolean not null default true,
  created_at       timestamptz not null default now()
);

-- The only admin account in db/aju_bot.db (users.id = 1, role 'admin').
insert into public.admins (id, name, email, position, avatar_initials)
values ('admin-1', 'AJU Administrator', 'admin@aju.example', 'Academic Operations Admin', 'AD')
on conflict (id) do nothing;

-- ---------- holidays ----------
create table if not exists public.holidays (
  id           text primary key,
  date         date not null unique,
  title        text not null,
  type         text not null check (type in ('festival', 'restricted', 'observance', 'saturday')),
  description  text not null default ''
);

insert into public.holidays (id, date, title, type, description) values
  ('h-1', '2026-10-02', 'Gandhi Jayanti', 'festival', 'National Holiday'),
  ('h-2', '2026-10-03', 'First Saturday Institutional Off', 'saturday', 'Alternate Non-instructional Saturday'),
  ('h-3', '2026-10-17', 'Third Saturday Institutional Off', 'saturday', 'Alternate Non-instructional Saturday'),
  ('h-4', '2026-10-20', 'Maha Saptami / Durga Puja', 'festival', 'Autumn Festival Vacation begins'),
  ('h-5', '2026-10-21', 'Maha Ashtami / Navami', 'festival', 'Durga Puja Celebrations'),
  ('h-6', '2026-10-22', 'Vijaya Dashami (Dussehra)', 'festival', 'Victory Day National Holiday'),
  ('h-7', '2026-10-31', 'Sardar Vallabhbhai Patel Jayanti', 'observance', 'National Unity Day Seminar')
on conflict (id) do nothing;

-- ---------- leave routing ----------
alter table public.leave_requests add column if not exists approver_id text references public.admins(id);
alter table public.leave_requests add column if not exists reviewed_by text references public.admins(id);

create or replace function public.leave_approver_for(dept text) returns text
language sql stable set search_path = '' as $$
  select id from public.admins
  where is_active and (departments is null or dept = any(departments))
  order by departments is null, created_at
  limit 1;
$$;

update public.leave_requests
set approver_id = public.leave_approver_for(dept_short)
where approver_id is null;

-- Rules enforced by the database, whatever the browser sends.
create or replace function public.leave_requests_guard() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.to_date < new.from_date then
    raise exception 'Leave end date % is before start date %', new.to_date, new.from_date;
  end if;
  if btrim(new.reason) = '' then
    raise exception 'A reason is required for leave';
  end if;

  -- An upsert of an existing row fires this INSERT trigger first; the UPDATE
  -- trigger that follows applies the update rules, so skip the new-request rules.
  if tg_op = 'INSERT' and exists (select 1 from public.leave_requests where id = new.id) then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.status := 'Pending';
    new.reviewed_at := null;
    new.reviewed_by := null;
    -- The database, not the browser, decides who receives the request
    new.approver_id := public.leave_approver_for(new.dept_short);
    if new.approver_id is null then
      raise exception 'No active admin is configured to review leave for department %', new.dept_short;
    end if;
    if exists (
      select 1 from public.leave_requests l
      where l.faculty_id = new.faculty_id and l.id <> new.id
        and l.status in ('Pending', 'Approved')
        and l.from_date <= new.to_date and l.to_date >= new.from_date
    ) then
      raise exception 'You already have a pending or approved leave overlapping % to %', new.from_date, new.to_date;
    end if;
  else
    if new.faculty_id <> old.faculty_id then
      raise exception 'A leave request cannot be moved to another faculty member';
    end if;
    if new.status = 'Pending' and old.status <> 'Pending' then
      raise exception 'A reviewed leave request cannot be set back to Pending';
    end if;
    if new.status <> old.status and new.reviewed_at is null then
      new.reviewed_at := to_char(now() at time zone 'Asia/Kolkata', 'YYYY-MM-DD HH24:MI');
    end if;
    new.approver_id := coalesce(new.approver_id, old.approver_id);
  end if;
  return new;
end;
$$;

drop trigger if exists leave_requests_guard on public.leave_requests;
create trigger leave_requests_guard before insert or update on public.leave_requests
  for each row execute function public.leave_requests_guard();

-- ---------- access ----------
-- Admins and holidays are read-only from the app: they are managed here in the dashboard.
alter table public.admins enable row level security;
alter table public.holidays enable row level security;

drop policy if exists "app can read admins" on public.admins;
create policy "app can read admins" on public.admins for select to anon, authenticated using (true);
drop policy if exists "app can read holidays" on public.holidays;
create policy "app can read holidays" on public.holidays for select to anon, authenticated using (true);

grant select on public.admins, public.holidays to anon, authenticated;
grant execute on function public.leave_approver_for(text) to anon, authenticated;

-- ---------- realtime ----------
-- Lets every open browser see leave and faculty changes without a refresh.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    begin
      alter publication supabase_realtime add table public.leave_requests;
    exception when duplicate_object then null;
    end;
    begin
      alter publication supabase_realtime add table public.faculty;
    exception when duplicate_object then null;
    end;
  end if;
end;
$$;
