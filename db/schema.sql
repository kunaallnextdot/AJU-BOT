-- =====================================================================
-- AJU BOT - Faculty & Admin Academic Operations Platform
-- Relational schema (SQLite syntax; see README.md for Postgres/MySQL notes)
-- Modules: faculty directory, courses, sections, timetable, live class
-- tracking, campus presence, syllabus progress, substitutions, leave,
-- course feedback status.
-- =====================================================================
PRAGMA foreign_keys = ON;

-- ---------- Master data ----------------------------------------------
CREATE TABLE departments (
    id    INTEGER PRIMARY KEY AUTOINCREMENT,
    code  TEXT NOT NULL UNIQUE,
    name  TEXT NOT NULL
);

CREATE TABLE rooms (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    code       TEXT NOT NULL UNIQUE,
    name       TEXT,
    building   TEXT,
    floor      INTEGER,
    capacity   INTEGER,
    room_type  TEXT NOT NULL CHECK (room_type IN ('Lecture Hall','Lab','Seminar Hall','Cabin'))
);

CREATE TABLE faculty (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_code  TEXT NOT NULL UNIQUE,
    full_name      TEXT NOT NULL,
    email          TEXT NOT NULL UNIQUE,
    phone          TEXT,
    designation    TEXT NOT NULL CHECK (designation IN ('Professor','Associate Professor','Assistant Professor')),
    department_id  INTEGER NOT NULL REFERENCES departments(id),
    cabin_room_id  INTEGER REFERENCES rooms(id),
    joined_on      TEXT,
    is_active      INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0,1)),
    source         TEXT NOT NULL DEFAULT 'sample' CHECK (source IN ('screenshot','sample'))
);

CREATE TABLE users (                       -- login accounts for the dashboard
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    email          TEXT NOT NULL UNIQUE,
    password_hash  TEXT NOT NULL,
    role           TEXT NOT NULL CHECK (role IN ('admin','faculty')),
    faculty_id     INTEGER UNIQUE REFERENCES faculty(id),
    is_active      INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0,1)),
    created_at     TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK ((role = 'faculty' AND faculty_id IS NOT NULL) OR role = 'admin')
);

CREATE TABLE sections (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    program        TEXT NOT NULL,
    branch         TEXT NOT NULL,
    semester       INTEGER NOT NULL,
    section_name   TEXT NOT NULL,
    academic_year  TEXT NOT NULL,
    strength       INTEGER,
    home_room_id   INTEGER REFERENCES rooms(id),
    UNIQUE (program, branch, semester, section_name, academic_year)
);

CREATE TABLE courses (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    code           TEXT NOT NULL UNIQUE,                 -- e.g. BTE27182
    title          TEXT NOT NULL,                        -- e.g. Cryptography & Network Security
    category       TEXT NOT NULL CHECK (category IN
                   ('Core','Elective-IV','Elective-V','Open Elective-II','Project','Internship')),
    credits        INTEGER,
    department_id  INTEGER NOT NULL REFERENCES departments(id),
    source         TEXT NOT NULL DEFAULT 'sample' CHECK (source IN ('screenshot','sample'))
);

-- Who teaches which course to which section
CREATE TABLE course_assignments (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    course_id   INTEGER NOT NULL REFERENCES courses(id),
    faculty_id  INTEGER NOT NULL REFERENCES faculty(id) ON UPDATE CASCADE,
    section_id  INTEGER NOT NULL REFERENCES sections(id),
    UNIQUE (course_id, section_id),
    UNIQUE (id, faculty_id, section_id)                  -- target for composite FK below
);

-- ---------- Timetable --------------------------------------------------
CREATE TABLE periods (
    id          INTEGER PRIMARY KEY,
    label       TEXT NOT NULL UNIQUE,                    -- P1..P6
    start_time  TEXT NOT NULL,                           -- 'HH:MM'
    end_time    TEXT NOT NULL
);

-- faculty_id / section_id are repeated here (and kept consistent by the
-- composite FK) so the database itself rejects double-booking.
CREATE TABLE timetable_slots (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    assignment_id  INTEGER NOT NULL,
    faculty_id     INTEGER NOT NULL,
    section_id     INTEGER NOT NULL,
    day_of_week    TEXT NOT NULL CHECK (day_of_week IN
                   ('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday')),
    period_id      INTEGER NOT NULL REFERENCES periods(id),
    room_id        INTEGER NOT NULL REFERENCES rooms(id),
    FOREIGN KEY (assignment_id, faculty_id, section_id)
        REFERENCES course_assignments(id, faculty_id, section_id) ON UPDATE CASCADE,
    UNIQUE (faculty_id, day_of_week, period_id),         -- teacher can't be in two places
    UNIQUE (section_id, day_of_week, period_id),         -- section can't have two classes
    UNIQUE (room_id,    day_of_week, period_id)          -- room can't be double-booked
);

-- ---------- Live class tracking ----------------------------------------
CREATE TABLE class_sessions (                -- one row per class actually held on a date
    id                      INTEGER PRIMARY KEY AUTOINCREMENT,
    slot_id                 INTEGER NOT NULL REFERENCES timetable_slots(id),
    session_date            TEXT NOT NULL,
    status                  TEXT NOT NULL DEFAULT 'scheduled'
                            CHECK (status IN ('scheduled','ongoing','completed','cancelled','substituted')),
    actual_start            TEXT,
    actual_end              TEXT,
    conducted_by_faculty_id INTEGER REFERENCES faculty(id),
    topic_covered           TEXT,
    students_present        INTEGER,
    remarks                 TEXT,
    UNIQUE (slot_id, session_date)
);

-- ---------- Campus presence ("who is on premises") ---------------------
CREATE TABLE faculty_presence (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    faculty_id       INTEGER NOT NULL REFERENCES faculty(id),
    presence_date    TEXT NOT NULL,
    status           TEXT NOT NULL CHECK (status IN ('In Campus','Off Campus','On Leave')),
    check_in         TEXT,
    check_out        TEXT,
    current_room_id  INTEGER REFERENCES rooms(id),
    last_seen_at     TEXT,
    UNIQUE (faculty_id, presence_date)
);

-- ---------- Syllabus management ----------------------------------------
CREATE TABLE syllabus_units (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    course_id      INTEGER NOT NULL REFERENCES courses(id),
    unit_no        INTEGER NOT NULL,
    title          TEXT NOT NULL,
    topics         TEXT,
    planned_hours  INTEGER,
    UNIQUE (course_id, unit_no)
);

CREATE TABLE syllabus_progress (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    assignment_id   INTEGER NOT NULL REFERENCES course_assignments(id),
    unit_id         INTEGER NOT NULL REFERENCES syllabus_units(id),
    status          TEXT NOT NULL CHECK (status IN ('not_started','in_progress','completed')),
    completion_pct  INTEGER NOT NULL DEFAULT 0 CHECK (completion_pct BETWEEN 0 AND 100),
    updated_on      TEXT,
    UNIQUE (assignment_id, unit_id)
);

-- ---------- Leave & substitution approvals -----------------------------
CREATE TABLE leave_requests (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    faculty_id          INTEGER NOT NULL REFERENCES faculty(id),
    leave_type          TEXT NOT NULL CHECK (leave_type IN ('Casual','Medical','Duty','Earned')),
    from_date           TEXT NOT NULL,
    to_date             TEXT NOT NULL,
    reason              TEXT,
    status              TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
    applied_at          TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reviewed_by_user_id INTEGER REFERENCES users(id),
    reviewed_at         TEXT,
    CHECK (to_date >= from_date)
);

CREATE TABLE substitution_requests (
    id                   INTEGER PRIMARY KEY AUTOINCREMENT,
    slot_id              INTEGER NOT NULL REFERENCES timetable_slots(id),
    session_date         TEXT NOT NULL,
    original_faculty_id  INTEGER NOT NULL REFERENCES faculty(id),
    substitute_faculty_id INTEGER NOT NULL REFERENCES faculty(id),
    reason               TEXT,
    status               TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
    requested_at         TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reviewed_by_user_id  INTEGER REFERENCES users(id),
    reviewed_at          TEXT,
    review_note          TEXT,
    CHECK (original_faculty_id <> substitute_faculty_id),
    UNIQUE (slot_id, session_date)
);

-- ---------- Course feedback ("Feedback Course List") -------------------
CREATE TABLE course_feedback_status (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    assignment_id   INTEGER NOT NULL UNIQUE REFERENCES course_assignments(id),
    status          TEXT NOT NULL CHECK (status IN ('Done','Pending')),
    response_count  INTEGER NOT NULL DEFAULT 0,
    avg_rating      REAL CHECK (avg_rating IS NULL OR avg_rating BETWEEN 1 AND 5),
    submitted_on    TEXT
);

-- ---------- Indexes ------------------------------------------------------
CREATE INDEX idx_faculty_dept        ON faculty(department_id);
CREATE INDEX idx_assign_faculty      ON course_assignments(faculty_id);
CREATE INDEX idx_slots_assignment    ON timetable_slots(assignment_id);
CREATE INDEX idx_sessions_date       ON class_sessions(session_date, status);
CREATE INDEX idx_presence_date       ON faculty_presence(presence_date, status);
CREATE INDEX idx_progress_assignment ON syllabus_progress(assignment_id);
CREATE INDEX idx_subst_status        ON substitution_requests(status);
CREATE INDEX idx_leave_status        ON leave_requests(status, from_date);

-- ---------- Views for the dashboard -------------------------------------
-- Matches the dropdown in your screenshot: "BTE27182-Elective-IV - Cryptography & Network Security"
CREATE VIEW v_course_dropdown AS
SELECT id AS course_id, code,
       CASE WHEN category IN ('Elective-IV','Elective-V','Open Elective-II')
            THEN category || ' - ' || title ELSE title END AS display_title,
       code || '-' ||
       CASE WHEN category IN ('Elective-IV','Elective-V','Open Elective-II')
            THEN category || ' - ' || title ELSE title END AS dropdown_label
FROM courses;

-- Weekly grid: one row per cell (Time/Day table)
CREATE VIEW v_timetable_grid AS
SELECT ts.id AS slot_id, sec.id AS section_id,
       'Sem ' || sec.semester || ' ' || sec.branch || '-' || sec.section_name AS section_label,
       ts.day_of_week, p.label AS period, p.start_time, p.end_time,
       c.code AS course_code, c.title AS course_title,
       f.id AS faculty_id, f.full_name AS faculty_name,
       r.code AS room, c.code || ' - ' || f.full_name AS cell_label
FROM timetable_slots ts
JOIN course_assignments ca ON ca.id = ts.assignment_id
JOIN courses c   ON c.id = ca.course_id
JOIN faculty f   ON f.id = ts.faculty_id
JOIN sections sec ON sec.id = ts.section_id
JOIN periods p   ON p.id = ts.period_id
JOIN rooms r     ON r.id = ts.room_id;

CREATE VIEW v_faculty_weekly_load AS
SELECT f.id AS faculty_id, f.full_name,
       COUNT(ts.id) AS periods_per_week,
       COUNT(DISTINCT ts.day_of_week) AS teaching_days
FROM faculty f LEFT JOIN timetable_slots ts ON ts.faculty_id = f.id
GROUP BY f.id;

CREATE VIEW v_syllabus_completion AS
SELECT ca.id AS assignment_id, c.code, c.title, f.full_name AS faculty_name,
       ROUND(AVG(sp.completion_pct), 1) AS completion_pct,
       SUM(sp.status = 'completed') AS units_completed,
       COUNT(sp.id) AS total_units
FROM course_assignments ca
JOIN courses c ON c.id = ca.course_id
JOIN faculty f ON f.id = ca.faculty_id
LEFT JOIN syllabus_progress sp ON sp.assignment_id = ca.id
GROUP BY ca.id;

-- "Feedback Course List" with Done/Pending
CREATE VIEW v_feedback_list AS
SELECT ca.id AS assignment_id,
       CASE WHEN c.category IN ('Elective-IV','Elective-V','Open Elective-II')
            THEN c.category || ' - ' || c.title ELSE c.title END
         || ' ( ' || f.full_name || ' )' AS label,
       fs.status, fs.response_count, fs.avg_rating
FROM course_feedback_status fs
JOIN course_assignments ca ON ca.id = fs.assignment_id
JOIN courses c ON c.id = ca.course_id
JOIN faculty f ON f.id = ca.faculty_id;
