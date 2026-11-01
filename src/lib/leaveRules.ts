import { AdminUser, LeaveRequest } from '../types';

// Mirrors public.leave_approver_for() in supabase/migrations: the database assigns the
// approver on insert, this copy lets the form show the recipient before submitting.
export const resolveApprover = (admins: AdminUser[], deptShort: string): AdminUser | null => {
  const active = admins.filter((a) => a.isActive !== false);
  return (
    active.find((a) => a.departments?.includes(deptShort)) ??
    active.find((a) => !a.departments) ??
    null
  );
};

/** Requests an admin is responsible for: routed to them, or not yet routed (legacy rows). */
export const isRoutedTo = (req: LeaveRequest, adminId: string) => !req.approverId || req.approverId === adminId;

export const findOverlappingLeave = (
  requests: LeaveRequest[],
  facultyId: string,
  fromDate: string,
  toDate: string
) =>
  requests.find(
    (l) =>
      l.facultyId === facultyId &&
      (l.status === 'Pending' || l.status === 'Approved') &&
      l.fromDate <= toDate &&
      l.toDate >= fromDate
  );

// YYYY-MM-DD strings are parsed as local dates; `new Date('2026-11-02')` is UTC midnight,
// which lands on the previous day in timezones west of UTC.
export const parseLocalDate = (s: string) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};

const pad = (n: number) => n.toString().padStart(2, '0');
export const toDateStr = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** Inclusive calendar days between two YYYY-MM-DD dates, 0 when the range is invalid. */
export const leaveDays = (fromDate: string, toDate: string) => {
  if (!fromDate || !toDate || toDate < fromDate) return 0;
  return Math.round((parseLocalDate(toDate).getTime() - parseLocalDate(fromDate).getTime()) / 86_400_000) + 1;
};
