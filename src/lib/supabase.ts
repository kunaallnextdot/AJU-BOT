import { createClient, SupabaseClient } from '@supabase/supabase-js';
<<<<<<< HEAD
import { FacultyMember, FacultySubject, LeaveRequest } from '../types';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

// Null when the env vars are missing: the app then runs on the bundled snapshot of db/aju_bot.db.
export const supabase: SupabaseClient | null = url && anonKey ? createClient(url, anonKey) : null;

// ---- Row shapes of the Supabase tables (snake_case columns, JSON for nested lists) ----

interface FacultyRow {
=======
import { FacultyMember, LeaveRequest } from '../types';

// import.meta.env is undefined when this file is imported by the Node seed script
const url = import.meta.env?.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env?.VITE_SUPABASE_ANON_KEY as string | undefined;

/** Null when the env vars are missing, so the app falls back to its bundled seed data. */
export const supabase: SupabaseClient | null = url && key ? createClient(url, key) : null;

// ---------- faculty ----------

export interface FacultyRow {
>>>>>>> 6bae4c969c2b86bdffa15cf9489199c3b32ba1ee
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
<<<<<<< HEAD
  subjects: FacultySubject[];
}

interface LeaveRow {
  id: string;
  faculty_id: string;
  faculty_name: string;
  department: string;
  dept_short: string;
  leave_type: LeaveRequest['leaveType'] | null;
  from_date: string;
  to_date: string;
  days_count: number;
  reason: string;
  status: LeaveRequest['status'];
  created_at: string;
  reviewed_at: string | null;
  substitutions: LeaveRequest['substitutions'];
}

const facultyFromRow = (r: FacultyRow): FacultyMember => ({
  id: r.id,
  name: r.name,
  role: 'faculty',
=======
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
>>>>>>> 6bae4c969c2b86bdffa15cf9489199c3b32ba1ee
  position: r.position,
  designation: r.designation ?? undefined,
  department: r.department,
  deptShort: r.dept_short,
<<<<<<< HEAD
  email: r.email,
=======
>>>>>>> 6bae4c969c2b86bdffa15cf9489199c3b32ba1ee
  phone: r.phone,
  employeeCode: r.employee_code ?? undefined,
  cabin: r.cabin,
  joinedOn: r.joined_on,
  avatarInitials: r.avatar_initials,
  currentSection: r.current_section,
  timetable: r.timetable ?? [],
  subjects: r.subjects ?? [],
});

<<<<<<< HEAD
const leaveFromRow = (r: LeaveRow): LeaveRequest => ({
  id: r.id,
  facultyId: r.faculty_id,
  facultyName: r.faculty_name,
  department: r.department,
  deptShort: r.dept_short,
  leaveType: r.leave_type ?? undefined,
  fromDate: r.from_date,
  toDate: r.to_date,
  daysCount: r.days_count,
  reason: r.reason,
  status: r.status,
  createdAt: r.created_at,
  reviewedAt: r.reviewed_at,
  substitutions: r.substitutions ?? [],
});

const leaveToRow = (l: LeaveRequest): LeaveRow => ({
=======
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
>>>>>>> 6bae4c969c2b86bdffa15cf9489199c3b32ba1ee
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
<<<<<<< HEAD
  status: l.status,
  created_at: l.createdAt,
  reviewed_at: l.reviewedAt ?? null,
  substitutions: l.substitutions,
});

// ---- Queries ----

const client = () => {
  if (!supabase) throw new Error('Supabase is not configured');
  return supabase;
};

export const fetchFaculty = async (): Promise<FacultyMember[]> => {
  const { data, error } = await client().from('faculty').select('*').order('id');
  if (error) throw error;
  // ids are 'fac-1'..'fac-10'; sort numerically so fac-10 doesn't land after fac-1
  return (data as FacultyRow[]).map(facultyFromRow).sort((a, b) => Number(a.id.split('-')[1]) - Number(b.id.split('-')[1]));
};

export const fetchLeaveRequests = async (): Promise<LeaveRequest[]> => {
  const { data, error } = await client().from('leave_requests').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return (data as LeaveRow[]).map(leaveFromRow);
};

// Updates are checked for a returned row: with RLS, a blocked update succeeds with zero rows.
const expectRow = (data: unknown[] | null, what: string) => {
  if (!data || data.length === 0) throw new Error(`${what} was not saved (no permission or row not found)`);
};

export const insertLeaveRequest = async (leave: LeaveRequest) => {
  const { data, error } = await client().from('leave_requests').insert(leaveToRow(leave)).select('id');
  if (error) throw error;
  expectRow(data, 'Leave request');
};

export const updateLeaveRequest = async (leave: LeaveRequest) => {
  const { status, reviewed_at, substitutions } = leaveToRow(leave);
  const { data, error } = await client()
    .from('leave_requests')
    .update({ status, reviewed_at, substitutions })
    .eq('id', leave.id)
    .select('id');
  if (error) throw error;
  expectRow(data, 'Leave decision');
};

export const updateFacultySubjects = async (facultyId: string, subjects: FacultySubject[]) => {
  const { data, error } = await client().from('faculty').update({ subjects }).eq('id', facultyId).select('id');
  if (error) throw error;
  expectRow(data, 'Syllabus update');
};

/** Live updates from other users. Needs Realtime enabled on the tables; silently idle otherwise. */
export const subscribeToChanges = (onChange: (table: 'faculty' | 'leave_requests') => void) => {
  if (!supabase) return () => undefined;
  const channel = supabase
    .channel('aju-bot-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'faculty' }, () => onChange('faculty'))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'leave_requests' }, () => onChange('leave_requests'))
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
};
=======
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
>>>>>>> 6bae4c969c2b86bdffa15cf9489199c3b32ba1ee
