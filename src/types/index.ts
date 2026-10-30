export type UserRole = 'admin' | 'faculty';

export type AccentColor = 'blue' | 'teal' | 'purple' | 'green' | 'amber' | 'rose';

export interface ThemeConfig {
  id: string;
  name: string;
  accent: AccentColor;
  primaryHex: string;
  deepHex: string;
  lightHex: string;
  borderHex: string;
  glowHex: string;
  description: string;
}

export type WeekDay = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';

export interface PeriodSlot {
  periodNumber: number;
  label: string;     // P1..P6
  startTime: string;
  endTime: string;
}

export interface ClassPeriod {
  slotId?: number;
  day: WeekDay;
  periodNumber: number;
  periodLabel?: string; // P1..P6
  startTime: string; // e.g. "10:00"
  endTime: string;   // e.g. "10:40"
  subject: string;
  subjectCode: string;
  semester: number;
  section: string;
  sectionLabel?: string; // e.g. "Sem 7 CSE-A"
  room: string;
}

export type UnitStatus = 'not_started' | 'in_progress' | 'completed';

export interface SyllabusModule {
  id: string;
  name: string;
  completed: boolean;
  status?: UnitStatus;
  completionPct?: number; // 0-100
  topics?: string | null;
  plannedHours?: number | null;
  updatedOn?: string | null;
}

export interface FacultySubject {
  id: string;
  name: string;
  code: string;
  semester: number;
  section: string;
  category?: string; // Core, Elective-IV, Project...
  credits?: number | null;
  modules: SyllabusModule[];
}

export interface FacultyMember {
  id: string;
  name: string;
  role: 'faculty';
  position: string;
  designation?: string;
  department: string;
  deptShort: string;
  email: string;
  phone?: string | null;
  employeeCode?: string;
  cabin?: string | null;
  joinedOn?: string | null;
  avatarInitials: string;
  currentSection: string; // e.g. "Sem 7 CSE-A"
  timetable: ClassPeriod[];
  subjects: FacultySubject[];
}

export interface AdminUser {
  id: string;
  name: string;
  role: 'admin';
  position: string;
  email: string;
  avatarInitials: string;
}

export type CurrentUser = AdminUser | FacultyMember;

export interface SubstitutionSlot {
  date: string;       // YYYY-MM-DD
  day: string;        // Monday, Tuesday, etc.
  periodNumber: number;
  startTime: string;
  endTime: string;
  subject: string;
  section: string;
  semester: number;
  substituteFacultyId: string;
  substituteFacultyName: string;
  room?: string;
  status?: 'Pending' | 'Approved' | 'Rejected';
  reviewNote?: string | null;
}

export type LeaveType = 'Casual' | 'Medical' | 'Duty' | 'Earned';

export interface LeaveRequest {
  id: string;
  facultyId: string;
  facultyName: string;
  department: string;
  deptShort: string;
  leaveType?: LeaveType;
  fromDate: string;   // YYYY-MM-DD
  toDate: string;     // YYYY-MM-DD
  daysCount: number;
  reason: string;
  substitutions: SubstitutionSlot[];
  status: 'Pending' | 'Approved' | 'Rejected';
  createdAt: string;
  reviewedAt?: string | null;
}

export type HolidayType = 'festival' | 'restricted' | 'observance' | 'saturday';

export interface AcademicHoliday {
  id: string;
  date: string;       // YYYY-MM-DD
  title: string;
  type: HolidayType;
  description: string;
}

export type FacultyLiveStatus = 'In Class' | 'Free' | 'On Leave';

export interface FacultyStatusDetail {
  status: FacultyLiveStatus;
  currentClass?: ClassPeriod;
  activeLeave?: LeaveRequest;
}

export type PresenceStatus = 'In Campus' | 'Off Campus' | 'On Leave';

export interface FacultyPresence {
  facultyId: string;
  date: string;
  status: PresenceStatus;
  checkIn: string | null;
  checkOut: string | null;
  room: string | null;
  lastSeenAt: string | null;
}

export type SessionStatus = 'scheduled' | 'ongoing' | 'completed' | 'cancelled' | 'substituted';

export interface ClassSession {
  id: number;
  slotId: number;
  facultyId: string;
  facultyName: string;
  date: string;
  day: WeekDay;
  periodLabel: string;
  startTime: string;
  endTime: string;
  subject: string;
  subjectCode: string;
  sectionLabel: string;
  room: string;
  status: SessionStatus;
  actualStart: string | null;
  actualEnd: string | null;
  conductedById: string | null;
  conductedByName: string | null;
  topic: string | null;
  studentsPresent: number | null;
  strength: number | null;
  remarks: string | null;
}

export interface CourseFeedback {
  assignmentId: number;
  facultyId: string;
  facultyName: string;
  courseCode: string;
  courseTitle: string;
  category: string;
  sectionLabel: string;
  status: 'Done' | 'Pending';
  responses: number;
  avgRating: number | null;
  submittedOn: string | null;
}
