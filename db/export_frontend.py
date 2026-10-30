"""Export aju_bot.db into typed frontend data (src/data/ajuData.ts).

The React app has no server yet, so the database is the source of truth and this
script snapshots it into the shapes the UI already consumes. Re-run after
changing seed data:

    python3 build_seed.py && python3 export_frontend.py
"""
import json, os, sqlite3
from datetime import date

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "..", "src", "data", "ajuData.ts")

con = sqlite3.connect(os.path.join(HERE, "aju_bot.db"))
con.row_factory = sqlite3.Row
rows = lambda sql, *a: [dict(r) for r in con.execute(sql, a)]

fid = lambda n: f"fac-{n}"
title = lambda s: s[:1].upper() + s[1:]
initials = lambda name: "".join(p[0] for p in name.split()[:2]).upper()
section_label = lambda r: f"Sem {r['semester']} {r['branch']}-{r['section_name']}"

periods = rows("SELECT id, label, start_time, end_time FROM periods ORDER BY id")
period_by_id = {p["id"]: p for p in periods}

slots = rows("""
  SELECT ts.id, ts.faculty_id, ts.day_of_week, ts.period_id, r.code AS room,
         c.title, c.code, sec.semester, sec.branch, sec.section_name, sec.strength
  FROM timetable_slots ts
  JOIN course_assignments ca ON ca.id = ts.assignment_id
  JOIN courses c ON c.id = ca.course_id
  JOIN sections sec ON sec.id = ts.section_id
  JOIN rooms r ON r.id = ts.room_id
  ORDER BY ts.faculty_id, ts.day_of_week, ts.period_id""")
slot_by_id = {s["id"]: s for s in slots}

def class_period(s):
    p = period_by_id[s["period_id"]]
    return {
        "slotId": s["id"], "day": s["day_of_week"], "periodNumber": p["id"], "periodLabel": p["label"],
        "startTime": p["start_time"], "endTime": p["end_time"],
        "subject": s["title"], "subjectCode": s["code"], "semester": s["semester"],
        "section": s["section_name"], "sectionLabel": section_label(s), "room": s["room"],
    }

faculty_rows = rows("""
  SELECT f.*, d.code AS dept_code, d.name AS dept_name, r.code AS cabin
  FROM faculty f JOIN departments d ON d.id = f.department_id
  LEFT JOIN rooms r ON r.id = f.cabin_room_id
  WHERE f.is_active = 1 ORDER BY f.id""")
names = {f["id"]: f["full_name"] for f in faculty_rows}
dept_of = {f["id"]: (f["dept_name"], f["dept_code"]) for f in faculty_rows}

faculty = []
for f in faculty_rows:
    mine = [s for s in slots if s["faculty_id"] == f["id"]]
    assignments = rows("""
      SELECT ca.id, c.title, c.code, c.category, c.credits, sec.semester, sec.branch, sec.section_name
      FROM course_assignments ca JOIN courses c ON c.id = ca.course_id
      JOIN sections sec ON sec.id = ca.section_id
      WHERE ca.faculty_id = ? ORDER BY ca.id""", f["id"])
    subjects = []
    for a in assignments:
        units = rows("""
          SELECT su.id, su.unit_no, su.title, su.topics, su.planned_hours,
                 COALESCE(sp.status, 'not_started') AS status, COALESCE(sp.completion_pct, 0) AS pct, sp.updated_on
          FROM syllabus_units su
          JOIN course_assignments ca ON ca.course_id = su.course_id AND ca.id = ?
          LEFT JOIN syllabus_progress sp ON sp.unit_id = su.id AND sp.assignment_id = ca.id
          ORDER BY su.unit_no""", a["id"])
        subjects.append({
            "id": f"asg-{a['id']}", "name": a["title"], "code": a["code"], "category": a["category"],
            "credits": a["credits"], "semester": a["semester"], "section": section_label(a),
            "modules": [{
                "id": f"unit-{a['id']}-{u['unit_no']}", "name": f"Unit {u['unit_no']}: {u['title']}",
                "completed": u["status"] == "completed", "status": u["status"], "completionPct": u["pct"],
                "topics": u["topics"], "plannedHours": u["planned_hours"], "updatedOn": u["updated_on"],
            } for u in units],
        })
    # "Current section" = the section this teacher meets most often
    counts = {}
    for s in mine:
        counts[section_label(s)] = counts.get(section_label(s), 0) + 1
    faculty.append({
        "id": fid(f["id"]), "name": f["full_name"], "role": "faculty",
        "position": f["designation"], "designation": f["designation"],
        "department": f["dept_name"], "deptShort": f["dept_code"],
        "email": f["email"], "phone": f["phone"], "employeeCode": f["employee_code"],
        "cabin": f["cabin"], "joinedOn": f["joined_on"], "avatarInitials": initials(f["full_name"]),
        "currentSection": max(counts, key=counts.get) if counts else "—",
        "timetable": [class_period(s) for s in mine],
        "subjects": subjects,
    })

subs = rows("SELECT * FROM substitution_requests ORDER BY id")

def substitution(r):
    s = slot_by_id[r["slot_id"]]
    p = period_by_id[s["period_id"]]
    return {
        "date": r["session_date"], "day": s["day_of_week"], "periodNumber": p["id"],
        "startTime": p["start_time"], "endTime": p["end_time"], "subject": s["title"],
        "section": s["section_name"], "semester": s["semester"], "room": s["room"],
        "substituteFacultyId": fid(r["substitute_faculty_id"]),
        "substituteFacultyName": names[r["substitute_faculty_id"]],
        "status": title(r["status"]), "reviewNote": r["review_note"],
    }

leave = []
for l in rows("SELECT * FROM leave_requests ORDER BY applied_at DESC"):
    d0, d1 = date.fromisoformat(l["from_date"]), date.fromisoformat(l["to_date"])
    linked = [s for s in subs if s["original_faculty_id"] == l["faculty_id"] and l["from_date"] <= s["session_date"] <= l["to_date"]]
    leave.append({
        "id": f"leave-{l['id']}", "facultyId": fid(l["faculty_id"]), "facultyName": names[l["faculty_id"]],
        "department": dept_of[l["faculty_id"]][0], "deptShort": dept_of[l["faculty_id"]][1],
        "leaveType": l["leave_type"], "fromDate": l["from_date"], "toDate": l["to_date"],
        "daysCount": (d1 - d0).days + 1, "reason": l["reason"], "status": title(l["status"]),
        "createdAt": l["applied_at"], "reviewedAt": l["reviewed_at"],
        "substitutions": [substitution(s) for s in linked],
    })

presence = [{
    "facultyId": fid(p["faculty_id"]), "date": p["presence_date"], "status": p["status"],
    "checkIn": p["check_in"], "checkOut": p["check_out"], "room": p["room"], "lastSeenAt": p["last_seen_at"],
} for p in rows("""SELECT fp.*, r.code AS room FROM faculty_presence fp
                   LEFT JOIN rooms r ON r.id = fp.current_room_id ORDER BY fp.presence_date, fp.faculty_id""")]

sessions = []
for cs in rows("SELECT * FROM class_sessions ORDER BY session_date, slot_id"):
    s = slot_by_id[cs["slot_id"]]
    p = period_by_id[s["period_id"]]
    sessions.append({
        "id": cs["id"], "slotId": s["id"], "facultyId": fid(s["faculty_id"]), "facultyName": names[s["faculty_id"]],
        "date": cs["session_date"], "day": s["day_of_week"], "periodLabel": p["label"],
        "startTime": p["start_time"], "endTime": p["end_time"], "subject": s["title"], "subjectCode": s["code"],
        "sectionLabel": section_label(s), "room": s["room"], "status": cs["status"],
        "actualStart": cs["actual_start"], "actualEnd": cs["actual_end"],
        "conductedById": fid(cs["conducted_by_faculty_id"]) if cs["conducted_by_faculty_id"] else None,
        "conductedByName": names.get(cs["conducted_by_faculty_id"]),
        "topic": cs["topic_covered"], "studentsPresent": cs["students_present"], "strength": s["strength"],
        "remarks": cs["remarks"],
    })

feedback = [{
    "assignmentId": r["assignment_id"], "facultyId": fid(r["faculty_id"]), "facultyName": r["full_name"],
    "courseCode": r["code"], "courseTitle": r["title"], "category": r["category"],
    "sectionLabel": section_label(r), "status": r["status"], "responses": r["response_count"],
    "avgRating": r["avg_rating"], "submittedOn": r["submitted_on"],
} for r in rows("""
  SELECT fs.*, ca.faculty_id, f.full_name, c.code, c.title, c.category, sec.semester, sec.branch, sec.section_name
  FROM course_feedback_status fs JOIN course_assignments ca ON ca.id = fs.assignment_id
  JOIN courses c ON c.id = ca.course_id JOIN faculty f ON f.id = ca.faculty_id
  JOIN sections sec ON sec.id = ca.section_id ORDER BY fs.id""")]

period_slots = [{"periodNumber": p["id"], "label": p["label"], "startTime": p["start_time"], "endTime": p["end_time"]} for p in periods]

dump = lambda v: json.dumps(v, indent=2, ensure_ascii=False)
with open(OUT, "w") as fh:
    fh.write("// AUTO-GENERATED by db/export_frontend.py from db/aju_bot.db. Do not edit by hand.\n")
    fh.write("import type { ClassSession, CourseFeedback, FacultyMember, FacultyPresence, LeaveRequest, PeriodSlot } from '../types';\n\n")
    for name, typ, val in [
        ("PERIOD_SLOTS", "PeriodSlot[]", period_slots),
        ("INITIAL_FACULTY", "FacultyMember[]", faculty),
        ("INITIAL_LEAVE_REQUESTS", "LeaveRequest[]", leave),
        ("FACULTY_PRESENCE", "FacultyPresence[]", presence),
        ("CLASS_SESSIONS", "ClassSession[]", sessions),
        ("COURSE_FEEDBACK", "CourseFeedback[]", feedback),
    ]:
        fh.write(f"export const {name}: {typ} = {dump(val)};\n\n")
print(f"wrote {os.path.relpath(OUT)}: {len(faculty)} faculty, {len(leave)} leave, {len(sessions)} sessions")
