import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { FacultyMember, LeaveRequest } from '../types';

// import.meta.env is undefined when this file is imported by the Node seed script
const url = import.meta.env?.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env?.VITE_SUPABASE_ANON_KEY as string | undefined;

/** Null when the env vars are missing, so the app falls back to its bundled seed data. */
export const supabase: SupabaseClient | null = url && key ? createClient(url, key) : null;

// ---------- faculty ----------

export interface FacultyRow {
  id: string;
  name: string;
  email: string;
  position: string;
  designation: string | null;
  department: string;
  dept_short: string;
  phone: string | null;
  employee_code: string | null;
  cabin: string | null;
  joined_on: string | null;
  avatar_initials: string;
  current_section: string;
  timetable: FacultyMember['timetable'];
  subjects: FacultyMember['subjects'];
}

export const facultyToRow = (f: FacultyMember): FacultyRow => ({
  id: f.id,
  name: f.name,
  email: f.email,
  position: f.position,
  designation: f.designation ?? null,
  department: f.department,
  dept_short: f.deptShort,
  phone: f.phone ?? null,
  employee_code: f.employeeCode ?? null,
  cabin: f.cabin ?? null,
  joined_on: f.joinedOn ?? null,
  avatar_initials: f.avatarInitials,
  current_section: f.currentSection,
  timetable: f.timetable,
  subjects: f.subjects,
});

export const rowToFaculty = (r: FacultyRow): FacultyMember => ({
  id: r.id,
  name: r.name,
  role: 'faculty',
  email: r.email,
  position: r.position,
  designation: r.designation ?? undefined,
  department: r.department,
  deptShort: r.dept_short,
  phone: r.phone,
  employeeCode: r.employee_code ?? undefined,
  cabin: r.cabin,
  joinedOn: r.joined_on,
  avatarInitials: r.avatar_initials,
  currentSection: r.current_section,
  timetable: r.timetable ?? [],
  subjects: r.subjects ?? [],
});

// ---------- leave requests ----------

export interface LeaveRow {
  id: string;
  faculty_id: string;
  faculty_name: string;
  department: string;
  dept_short: string;
  leave_type: string | null;
  from_date: string;
  to_date: string;
  days_count: number;
  reason: string;
  substitutions: LeaveRequest['substitutions'];
  status: LeaveRequest['status'];
  created_at: string;
  reviewed_at: string | null;
}

export const leaveToRow = (l: LeaveRequest): LeaveRow => ({
  id: l.id,
  faculty_id: l.facultyId,
  faculty_name: l.facultyName,
  department: l.department,
  dept_short: l.deptShort,
  leave_type: l.leaveType ?? null,
  from_date: l.fromDate,
  to_date: l.toDate,
  days_count: l.daysCount,
  reason: l.reason,
  substitutions: l.substitutions,
  status: l.status,
  created_at: l.createdAt,
  reviewed_at: l.reviewedAt ?? null,
});

export const rowToLeave = (r: LeaveRow): LeaveRequest => ({
  id: r.id,
  facultyId: r.faculty_id,
  facultyName: r.faculty_name,
  department: r.department,
  deptShort: r.dept_short,
  leaveType: (r.leave_type ?? undefined) as LeaveRequest['leaveType'],
  fromDate: r.from_date,
  toDate: r.to_date,
  daysCount: r.days_count,
  reason: r.reason,
  substitutions: r.substitutions ?? [],
  status: r.status,
  createdAt: r.created_at,
  reviewedAt: r.reviewed_at,
});
