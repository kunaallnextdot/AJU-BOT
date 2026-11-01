import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  BookOpen,
  CalendarCheck,
  ArrowRight,
  Check,
  MoreHorizontal,
  XCircle,
} from 'lucide-react';
import { LiveStrip, ModuleCard, SectionLabel, StatCard } from '../common/ui';
import { RecentActivity } from './RecentActivity';
import { CampusPresenceCard, CourseFeedbackCard, TeachingLoadChart, WeeklyClassesChart } from './AdminCharts';

interface AdminDashboardProps {
  onNavigateTab: (tab: string, filter?: string) => void;
  onOpenFacultyDrawer: (facultyId: string) => void;
}

const statusTone = {
  teaching: { label: 'In class', dot: 'bg-blue-600', text: 'text-blue-700', bg: 'bg-blue-50' },
  free: { label: 'Free now', dot: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50' },
  leave: { label: 'On leave', dot: 'bg-amber-500', text: 'text-amber-700', bg: 'bg-amber-50' },
};

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigateTab, onOpenFacultyDrawer }) => {
  const { currentUser, facultyList, leaveRequests, getFacultyLiveStatus, clock, updateLeaveRequestStatus, sessions } = useApp();

  const greeting = (() => {
    const hour = Number(clock.timeStr.split(':')[0]);
    return hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  })();

  const facultyStatuses = facultyList.map((faculty) => ({ faculty, detail: getFacultyLiveStatus(faculty.id) }));
  const teaching = facultyStatuses.filter(({ detail }) => detail.status === 'In Class').length;
  const free = facultyStatuses.filter(({ detail }) => detail.status === 'Free').length;
  const onLeave = facultyStatuses.filter(({ detail }) => detail.status === 'On Leave').length;
  const pendingLeaves = leaveRequests.filter((leave) => leave.status === 'Pending');
  const activePercent = facultyList.length ? Math.round((teaching / facultyList.length) * 100) : 0;
  const departmentCount = new Set(facultyList.map((f) => f.department)).size;

  const currentlyTeaching = facultyStatuses.find(({ detail }) => detail.status === 'In Class');
  const sessionsToday = sessions.filter((x) => x.date === clock.dateStr);
  const classesToday = facultyList.reduce((n, f) => n + f.timetable.filter((slot) => slot.day === clock.dayName).length, 0);
  const substitutionsToday = leaveRequests
    .filter((leave) => leave.status !== 'Rejected')
    .reduce((n, leave) => n + leave.substitutions.filter((sub) => sub.date === clock.dateStr).length, 0);

  // Who is free right now, or failing that, who finishes their current class first
  const nextFree = (() => {
    const freeNow = facultyStatuses.find(({ detail }) => detail.status === 'Free');
    if (freeNow) return { name: freeNow.faculty.name, note: `${freeNow.faculty.department} · available now` };
    const soonest = facultyStatuses
      .filter(({ detail }) => detail.status === 'In Class' && detail.currentClass)
      .sort((a, b) => a.detail.currentClass!.endTime.localeCompare(b.detail.currentClass!.endTime))[0];
    return soonest ? { name: soonest.faculty.name, note: `free from ${soonest.detail.currentClass!.endTime}` } : null;
  })();

  const syllabus = (() => {
    const modules = facultyList.flatMap((f) => f.subjects.flatMap((subject) => subject.modules));
    const completed = modules.filter((m) => m.completed).length;
    return { total: modules.length, completed, rate: modules.length ? (completed / modules.length) * 100 : 0 };
  })();

  const approvedLeaves = leaveRequests.filter((leave) => leave.status === 'Approved').length;
  const decidedLeaves = leaveRequests.filter((leave) => leave.status !== 'Pending').length;
  const approvalRate = decidedLeaves ? (approvedLeaves / decidedLeaves) * 100 : 0;

  return (
    <div className="space-y-4 pb-8 animate-in fade-in duration-200 sm:space-y-5">
      <div className="flex flex-col justify-between gap-1.5 border-b border-[#e2ecf9] pb-2 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-base font-extrabold tracking-tight text-[#10233f] sm:text-lg">{greeting}, {currentUser?.name.split(' ')[0] || 'Admin'}</h2>
          <p className="mt-0.5 text-[11px] font-medium text-[#657894]">
            Operations overview for <span className="font-semibold text-[#10233f]">{clock.dayName}</span>, Academic Session 2026–2027.
          </p>
        </div>
        <span className="inline-flex items-center gap-2 self-start rounded-full border border-[#dce8f7] bg-white px-2 py-0.5 text-[10px] font-semibold text-[#10233f] shadow-xs sm:self-auto">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" /> {clock.dayName} · {clock.dateStr}
        </span>
      </div>

      <LiveStrip
        items={[
          {
            label: 'In class now',
            value: <>{teaching} of {facultyList.length} faculty</>,
            sub: currentlyTeaching ? `${currentlyTeaching.faculty.name} · ${currentlyTeaching.detail.currentClass?.room} · until ${currentlyTeaching.detail.currentClass?.endTime}` : 'No class running right now',
          },
          {
            label: 'Classes today',
            value: classesToday,
            sub: sessionsToday.length
              ? `${sessionsToday.filter((x) => x.status === 'completed' || x.status === 'substituted').length} held · ${sessionsToday.filter((x) => x.status === 'cancelled').length} cancelled · ${substitutionsToday} substitution${substitutionsToday === 1 ? '' : 's'}`
              : `${substitutionsToday} substitution${substitutionsToday === 1 ? '' : 's'} · ${pendingLeaves.length} pending approval${pendingLeaves.length === 1 ? '' : 's'}`,
          },
          {
            label: 'Next free',
            value: nextFree ? nextFree.name : '—',
            sub: nextFree ? nextFree.note : 'Everyone is busy or on leave',
          },
        ]}
      />

      <section>
        <SectionLabel>Overview</SectionLabel>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-3.5 lg:grid-cols-4">
          <StatCard title="Total Faculty" value={facultyList.length} context={`Across ${departmentCount} departments`} pill={{ label: `${free} free now`, tone: 'up' }} onClick={() => onNavigateTab('faculty', 'all')} />
          <StatCard title="Teaching Now" value={teaching} context={`${activePercent}% of faculty`} pill={{ label: 'Live now', tone: 'live' }} onClick={() => onNavigateTab('faculty', 'In Class')} />
          <StatCard title="Syllabus Coverage" value={`${syllabus.rate.toFixed(1)}%`} context="Modules completed" pill={{ label: `${syllabus.completed}/${syllabus.total} done`, tone: 'up' }} />
          <StatCard title="Pending Requests" value={pendingLeaves.length} context="Leave approvals" pill={pendingLeaves.length > 0 ? { label: 'Needs action', tone: 'down' } : { label: 'All clear', tone: 'up' }} onClick={() => onNavigateTab('leave')} />
        </div>
      </section>

      <RecentActivity onOpenLeave={() => onNavigateTab('leave')} onOpenFaculty={onOpenFacultyDrawer} />

      <ModuleCard
        icon={BookOpen}
        title="Syllabus Progress"
        description="Module completion across every subject and department"
        stats={[
          { label: 'Total Modules', value: syllabus.total, tone: 'yellow' },
          { label: 'Pending', value: syllabus.total - syllabus.completed, tone: 'pink' },
          { label: 'Completed', value: syllabus.completed, tone: 'blue' },
        ]}
        rate={syllabus.rate}
        onViewMore={() => onNavigateTab('faculty')}
      />

      <ModuleCard
        icon={CalendarCheck}
        title="Leave & Substitution"
        description="Requests, approvals and class cover arranged by faculty"
        stats={[
          { label: 'Total Requests', value: leaveRequests.length, tone: 'yellow' },
          { label: 'Pending', value: pendingLeaves.length, tone: 'pink' },
          { label: 'Approved', value: approvedLeaves, tone: 'blue' },
        ]}
        rateLabel="Approval Rate"
        rate={approvalRate}
        onViewMore={() => onNavigateTab('leave')}
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.4fr_1fr]">
        <WeeklyClassesChart />
        <CampusPresenceCard />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_1.4fr]">
        <TeachingLoadChart onOpenFaculty={onOpenFacultyDrawer} />
        <CourseFeedbackCard />
      </div>

      <section className="rounded-2xl border border-[#dce8f7] bg-white p-4.5 shadow-[0_10px_30px_rgba(31,76,126,0.06)] sm:p-5">
        <div className="mb-3.5 flex items-center justify-between gap-3 border-b border-[#eaf2fc] pb-2.5"><div><div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-amber-500" /><h3 className="text-[13px] font-bold text-[#10233f]">Needs your attention</h3><span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">{pendingLeaves.length} open</span></div><p className="mt-0.5 text-[11px] text-[#657894]">Approve leave requests and keep substitutions moving.</p></div><button onClick={() => onNavigateTab('leave')} className="inline-flex cursor-pointer items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800">See all <ArrowRight className="h-3 w-3" /></button></div>
        {pendingLeaves.length === 0 ? <div className="rounded-xl border border-dashed border-[#bfdbfe] bg-[#f8fbff] py-5 text-center text-[11px] text-[#657894]">No pending requests. Your queue is clear.</div> : <div className="space-y-2.5">{pendingLeaves.slice(0, 3).map((leave) => <div key={leave.id} className="flex flex-col gap-3 rounded-xl border border-[#e2ecf9] bg-[#f9fcff] p-3 transition hover:border-[#bfdbfe] md:flex-row md:items-center md:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="text-xs font-bold text-[#10233f]">{leave.facultyName}</span><span className="text-[11px] text-[#657894]">{leave.department}</span><span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">{leave.daysCount} days</span></div><p className="mt-1 truncate text-xs text-[#657894]">{leave.reason}</p><p className="mt-1 font-mono text-[10px] text-[#94a3b8]">{leave.fromDate} → {leave.toDate} · {leave.substitutions.length} substitutions mapped</p></div><div className="flex shrink-0 items-center gap-2"><button onClick={() => updateLeaveRequestStatus(leave.id, 'Approved')} className="inline-flex items-center gap-1.5 cursor-pointer rounded-lg bg-emerald-600 px-3 py-1.5 text-[11px] font-bold text-white shadow-xs transition hover:bg-emerald-700"><Check className="h-3 w-3" /> Approve</button><button onClick={() => updateLeaveRequestStatus(leave.id, 'Rejected')} className="inline-flex items-center gap-1.5 cursor-pointer rounded-lg border border-red-200 bg-white px-3 py-1.5 text-[11px] font-bold text-red-600 transition hover:bg-red-50"><XCircle className="h-3 w-3" /> Reject</button></div></div>)}</div>}
      </section>

      <section className="rounded-2xl border border-[#dce8f7] bg-white p-4.5 shadow-[0_10px_30px_rgba(31,76,126,0.06)] sm:p-5">
        <div className="mb-3.5 flex items-center justify-between border-b border-[#eaf2fc] pb-2.5"><div><h3 className="text-[13px] font-bold text-[#10233f]">Faculty at a glance</h3><p className="mt-0.5 text-[11px] text-[#657894]">Live availability based on timetable and approved leave.</p></div><MoreHorizontal className="h-5 w-5 text-[#94a3b8]" /></div>
        <div className="grid gap-2.5 md:grid-cols-2 xl:grid-cols-3">{facultyStatuses.map(({ faculty, detail }) => { const tone = detail.status === 'In Class' ? statusTone.teaching : detail.status === 'On Leave' ? statusTone.leave : statusTone.free; return <button key={faculty.id} onClick={() => onOpenFacultyDrawer(faculty.id)} className="group flex w-full min-w-0 items-center gap-3 cursor-pointer rounded-xl border border-[#e2ecf9] bg-[#f9fcff] p-3 text-left transition hover:-translate-y-0.5 hover:border-[#bfdbfe] hover:bg-white hover:shadow-sm"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#2563eb] to-[#1d4ed8] text-xs font-bold text-white shadow-xs">{faculty.avatarInitials}</div><div className="min-w-0 flex-1"><p className="truncate text-xs font-bold text-[#10233f]">{faculty.name}</p><p className="mt-0.5 truncate text-[10px] text-[#657894]">{faculty.department} · {faculty.currentSection}</p></div><span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[10px] font-bold ${tone.bg} ${tone.text}`}><span className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} />{tone.label}</span></button>; })}</div>
      </section>
    </div>
  );
};
