import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useLeaveReview } from '../../lib/useLeaveReview';
import {
  ArrowRight,
  BookOpen,
  CalendarClock,
  Check,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  Users,
  XCircle,
} from 'lucide-react';
import { RecentActivity } from './RecentActivity';
import { CampusPresenceCard, CourseFeedbackCard, TeachingLoadChart, WeeklyClassesChart } from './AdminCharts';

interface AdminDashboardProps {
  onNavigateTab: (tab: string, filter?: string) => void;
  onOpenFacultyDrawer: (facultyId: string) => void;
}

// One place for the three faculty states, so the summary and the list always agree
const STATUS = {
  'In Class': { label: 'In class', dot: 'bg-blue-600', chip: 'bg-blue-50 text-blue-700' },
  Free: { label: 'Free', dot: 'bg-emerald-500', chip: 'bg-emerald-50 text-emerald-700' },
  'On Leave': { label: 'On leave', dot: 'bg-amber-500', chip: 'bg-amber-50 text-amber-700' },
} as const;

const Section: React.FC<{ title: string; hint: string; action?: React.ReactNode; children: React.ReactNode }> = ({ title, hint, action, children }) => (
  <section className="rounded-2xl border border-[#dce8f7] bg-white p-5">
    <div className="mb-4 flex items-start justify-between gap-3">
      <div>
        <h3 className="text-[15px] font-bold text-[#10233f]">{title}</h3>
        <p className="mt-0.5 text-[13px] text-[#657894]">{hint}</p>
      </div>
      {action}
    </div>
    {children}
  </section>
);

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigateTab, onOpenFacultyDrawer }) => {
  const { facultyList, leaveRequests, getFacultyLiveStatus, clock, sessions, feedback } = useApp();
  const { review, busyId } = useLeaveReview();
  const [showReports, setShowReports] = useState(false);

  const hour = Number(clock.timeStr.split(':')[0]);
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  // ---- Today ----
  const people = facultyList.map((faculty) => ({ faculty, detail: getFacultyLiveStatus(faculty.id) }));
  const byStatus = (s: keyof typeof STATUS) => people.filter(({ detail }) => detail.status === s);
  const inClass = byStatus('In Class');
  const free = byStatus('Free');
  const onLeave = byStatus('On Leave');

  const classesToday = facultyList.flatMap((f) => f.timetable.filter((slot) => slot.day === clock.dayName));
  const classesDone = classesToday.filter((slot) => slot.endTime <= clock.timeStr).length;
  const pending = leaveRequests.filter((l) => l.status === 'Pending');

  const units = facultyList.flatMap((f) => f.subjects.flatMap((s) => s.modules));
  const unitsDone = units.filter((m) => m.completed).length;
  const syllabusPct = units.length ? Math.round((unitsDone / units.length) * 100) : 0;

  // ---- This week ----
  const held = sessions.filter((s) => s.status === 'completed' || s.status === 'substituted');
  const cancelled = sessions.filter((s) => s.status === 'cancelled').length;
  const substituted = sessions.filter((s) => s.status === 'substituted').length;
  const present = held.reduce((n, s) => n + (s.studentsPresent ?? 0), 0);
  const strength = held.reduce((n, s) => n + (s.strength ?? 0), 0);
  const attendance = strength ? Math.round((present / strength) * 100) : null;
  const rated = feedback.filter((f) => f.avgRating !== null);
  const avgRating = rated.length ? rated.reduce((n, f) => n + (f.avgRating ?? 0), 0) / rated.length : null;
  const approved = leaveRequests.filter((l) => l.status === 'Approved').length;
  const rejected = leaveRequests.filter((l) => l.status === 'Rejected').length;

  const todayCards = [
    {
      icon: Users,
      value: facultyList.length,
      label: 'Faculty members',
      hint: `${inClass.length} in class · ${free.length} free · ${onLeave.length} on leave`,
      onClick: () => onNavigateTab('faculty', 'all'),
    },
    {
      icon: CalendarClock,
      value: classesToday.length,
      label: 'Classes today',
      hint: classesToday.length ? `${classesDone} finished so far` : `No classes on ${clock.dayName}`,
      onClick: () => onNavigateTab('faculty'),
    },
    {
      icon: ClipboardCheck,
      value: pending.length,
      label: 'Leave requests waiting',
      hint: pending.length ? 'Needs your approval' : 'Nothing to review',
      urgent: pending.length > 0,
      onClick: () => onNavigateTab('leave'),
    },
    {
      icon: BookOpen,
      value: `${syllabusPct}%`,
      label: 'Syllabus completed',
      hint: `${unitsDone} of ${units.length} units taught`,
      onClick: () => onNavigateTab('faculty'),
    },
  ];

  const weekFacts = [
    `${held.length} of ${sessions.length} classes were held${cancelled ? `, ${cancelled} cancelled` : ''}${substituted ? `, ${substituted} taken by a substitute` : ''}.`,
    attendance !== null ? `Average student attendance was ${attendance}%.` : 'No attendance recorded yet.',
    `Feedback received for ${rated.length} of ${feedback.length} courses${avgRating ? ` (average ${avgRating.toFixed(1)} out of 5)` : ''}.`,
    `${approved} leave request${approved === 1 ? '' : 's'} approved, ${rejected} rejected, ${pending.length} waiting.`,
  ];

  const groups: { key: keyof typeof STATUS; list: typeof people }[] = [
    { key: 'In Class', list: inClass },
    { key: 'Free', list: free },
    { key: 'On Leave', list: onLeave },
  ];

  return (
    <div className="space-y-5 pb-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[#10233f]">{greeting}, Admin</h2>
          <p className="mt-1 text-[13px] text-[#657894]">Everything happening at Arka Jain University today, on one page.</p>
        </div>
        <span className="self-start rounded-full border border-[#dce8f7] bg-white px-3 py-1 text-[12px] font-semibold text-[#10233f] sm:self-auto">
          {clock.dayName}, {clock.dateStr}
        </span>
      </div>

      {/* 1. Today at a glance */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {todayCards.map(({ icon: Icon, value, label, hint, urgent, onClick }) => (
          <button
            key={label}
            onClick={onClick}
            className={`group rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md ${urgent ? 'border-amber-300 bg-amber-50' : 'border-[#dce8f7] bg-white'}`}
          >
            <div className="flex items-center justify-between">
              <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${urgent ? 'bg-amber-100 text-amber-700' : 'bg-blue-50 text-blue-600'}`}>
                <Icon className="h-[18px] w-[18px]" />
              </span>
              <ArrowRight className="h-4 w-4 text-[#94a3b8] transition group-hover:translate-x-0.5 group-hover:text-blue-600" />
            </div>
            <p className="mt-3 text-3xl font-bold tabular-nums text-[#10233f]">{value}</p>
            <p className="mt-0.5 text-[14px] font-semibold text-[#10233f]">{label}</p>
            <p className={`mt-1 text-[12px] ${urgent ? 'font-semibold text-amber-800' : 'text-[#657894]'}`}>{hint}</p>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.3fr_1fr]">
        {/* 2. What needs the admin */}
        <Section
          title="Needs your action"
          hint="Leave requests from faculty. Approving also confirms their substitute teachers."
          action={
            <button onClick={() => onNavigateTab('leave')} className="shrink-0 text-[13px] font-semibold text-blue-600 hover:underline">
              All requests
            </button>
          }
        >
          {pending.length === 0 ? (
            <div className="flex items-center gap-3 rounded-xl bg-emerald-50 px-4 py-4 text-[14px] font-medium text-emerald-800">
              <CheckCircle2 className="h-5 w-5 shrink-0" /> You're all caught up. No requests are waiting.
            </div>
          ) : (
            <div className="space-y-3">
              {pending.map((leave) => (
                <div key={leave.id} className="rounded-xl border border-[#e2ecf9] p-4">
                  <p className="text-[14px] text-[#10233f]">
                    <strong>{leave.facultyName}</strong> wants {leave.daysCount} day{leave.daysCount > 1 ? 's' : ''} of {leave.leaveType ? `${leave.leaveType.toLowerCase()} ` : ''}leave
                  </p>
                  <p className="mt-1 text-[13px] text-[#657894]">
                    {leave.fromDate === leave.toDate ? leave.fromDate : `${leave.fromDate} to ${leave.toDate}`} · “{leave.reason}”
                  </p>
                  <p className="mt-1 text-[12px] text-[#657894]">
                    {leave.substitutions.length
                      ? `Classes covered by: ${Array.from(new Set(leave.substitutions.map((s) => s.substituteFacultyName))).join(', ')}`
                      : 'No classes need covering'}
                  </p>
                  <div className="mt-3 flex gap-2">
                    <button onClick={() => review(leave.id, 'Approved')} disabled={busyId === leave.id} className="disabled:opacity-60 inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-[13px] font-semibold text-white hover:bg-emerald-700">
                      <Check className="h-4 w-4" /> Approve
                    </button>
                    <button onClick={() => review(leave.id, 'Rejected')} disabled={busyId === leave.id} className="disabled:opacity-60 inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-4 py-2 text-[13px] font-semibold text-red-600 hover:bg-red-50">
                      <XCircle className="h-4 w-4" /> Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* Week summary in plain sentences instead of charts */}
        <Section title="This week in short" hint="A quick summary of classes, attendance and feedback.">
          <ul className="space-y-3">
            {weekFacts.map((fact) => (
              <li key={fact} className="flex gap-2.5 text-[14px] leading-snug text-[#10233f]">
                <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                {fact}
              </li>
            ))}
          </ul>
        </Section>
      </div>

      {/* 3. Who is where */}
      <Section title="Who's available right now" hint="Based on the timetable and approved leave. Click a name to see their full profile.">
        <div className="space-y-4">
          {groups.map(({ key, list }) => (
            <div key={key} className="border-t border-[#eef3fb] pt-3 first:border-0 first:pt-0">
              <p className="mb-2 flex items-center gap-2 text-[13px] font-semibold text-[#10233f]">
                <span className={`h-2 w-2 rounded-full ${STATUS[key].dot}`} />
                {STATUS[key].label} <span className="font-normal text-[#657894]">({list.length})</span>
              </p>
              {list.length === 0 ? (
                <p className="rounded-lg bg-[#f7faff] px-3 py-2.5 text-[13px] text-[#94a3b8]">Nobody</p>
              ) : (
                <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 xl:grid-cols-4">
                  {list.map(({ faculty, detail }) => (
                    <button
                      key={faculty.id}
                      onClick={() => onOpenFacultyDrawer(faculty.id)}
                      className="flex w-full min-w-0 items-center gap-2.5 rounded-lg px-2 py-2 text-left hover:bg-[#f4f8ff]"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[11px] font-bold text-white">
                        {faculty.avatarInitials}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-[13px] font-semibold text-[#10233f]">{faculty.name}</span>
                        <span className="block truncate text-[12px] text-[#657894]">
                          {detail.currentClass
                            ? `${detail.currentClass.subject} · ${detail.currentClass.room} · till ${detail.currentClass.endTime}`
                            : key === 'On Leave'
                            ? 'Away today'
                            : faculty.designation ?? faculty.position}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </Section>

      {/* Charts, tables and export stay available, just out of the way */}
      <div>
        <button
          onClick={() => setShowReports((v) => !v)}
          aria-expanded={showReports}
          className="flex w-full items-center justify-between rounded-2xl border border-[#dce8f7] bg-white px-5 py-4 text-left hover:bg-[#f9fcff]"
        >
          <span>
            <span className="block text-[15px] font-bold text-[#10233f]">Detailed reports</span>
            <span className="block text-[13px] text-[#657894]">Class charts, teaching load, campus check-ins, course feedback and the full activity log with export.</span>
          </span>
          <ChevronDown className={`h-5 w-5 shrink-0 text-[#657894] transition ${showReports ? 'rotate-180' : ''}`} />
        </button>
        {showReports && (
          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.4fr_1fr]">
              <WeeklyClassesChart />
              <CampusPresenceCard />
            </div>
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_1.4fr]">
              <TeachingLoadChart onOpenFaculty={onOpenFacultyDrawer} />
              <CourseFeedbackCard />
            </div>
            <RecentActivity onOpenLeave={() => onNavigateTab('leave')} onOpenFaculty={onOpenFacultyDrawer} />
          </div>
        )}
      </div>
    </div>
  );
};
