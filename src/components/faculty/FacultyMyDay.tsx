import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { FacultyMember, ClassPeriod, SubstitutionSlot } from '../../types';
import {
  Sparkles,
  Clock,
  BookOpen,
  MapPin,
  CheckCircle2,
  PlayCircle,
  Calendar,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { LiveStrip, SectionLabel, StatCard } from '../common/ui';

interface FacultyMyDayProps {
  faculty: FacultyMember;
  onNavigateTab: (tab: string) => void;
}

export const FacultyMyDay: React.FC<FacultyMyDayProps> = ({ faculty, onNavigateTab }) => {
  const { clock, currentTheme, leaveRequests } = useApp();

  const getGreeting = () => {
    const hour = parseInt(clock.timeStr.split(':')[0], 10);
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const timeToMins = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };

  const currentMins = timeToMins(clock.timeStr);

  // Today's regular classes from faculty's timetable
  const todayClasses = faculty.timetable
    .filter((c) => c.day === clock.dayName)
    .sort((a, b) => timeToMins(a.startTime) - timeToMins(b.startTime));

  // Today's assigned substitute periods
  const todaySubstituteClasses = useMemo(() => {
    const list: {
      sub: SubstitutionSlot;
      requestingFacultyName: string;
      reason: string;
    }[] = [];

    leaveRequests.forEach((req) => {
      if (req.status === 'Approved' || req.status === 'Pending') {
        req.substitutions.forEach((s) => {
          if (
            s.substituteFacultyId === faculty.id &&
            (s.date === clock.dateStr || s.day === clock.dayName)
          ) {
            list.push({
              sub: s,
              requestingFacultyName: req.facultyName,
              reason: req.reason,
            });
          }
        });
      }
    });

    return list;
  }, [leaveRequests, faculty.id, clock.dateStr, clock.dayName]);

  // Determine status of each class today
  const getPeriodStatus = (period: ClassPeriod): 'Upcoming' | 'In Progress' | 'Done' => {
    const startMins = timeToMins(period.startTime);
    const endMins = timeToMins(period.endTime);

    if (currentMins < startMins) return 'Upcoming';
    if (currentMins >= startMins && currentMins <= endMins) return 'In Progress';
    return 'Done';
  };

  // Find currently active class or next upcoming
  const inProgressClass = todayClasses.find((c) => getPeriodStatus(c) === 'In Progress');
  const upcomingClasses = todayClasses.filter((c) => getPeriodStatus(c) === 'Upcoming');
  const completedClasses = todayClasses.filter((c) => getPeriodStatus(c) === 'Done');

  const syllabus = (() => {
    const modules = faculty.subjects.flatMap((subject) => subject.modules);
    const completed = modules.filter((m) => m.completed).length;
    return { total: modules.length, completed, rate: modules.length ? (completed / modules.length) * 100 : 0 };
  })();

  return (
    <div className="space-y-4 sm:space-y-5 animate-in fade-in duration-200">
      {/* Top Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pb-2 border-b border-[#dce8f7]">
        <div>
          <h2 className="text-base sm:text-lg font-extrabold text-[#10233f] tracking-tight">
            {getGreeting()}, {faculty.name.replace(/^(Dr|Prof)\.\s*/, '').split(' ')[0]}
          </h2>
          <p className="text-[11px] font-medium text-[#657894] mt-0.5">
            Your schedule for <strong className="text-[#10233f]">{clock.dayName}</strong> ({clock.dateStr})
          </p>
        </div>

        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-[#dce8f7] text-[11px] font-semibold text-[#10233f] shadow-xs">
          <Clock className="w-3 h-3 text-blue-600" />
          <span className="font-mono tabular-nums">{clock.timeStr}</span>
        </div>
      </div>

      <LiveStrip
        items={[
          {
            label: 'In class now',
            value: inProgressClass ? inProgressClass.subject : 'Not teaching',
            sub: inProgressClass ? `${inProgressClass.section} · ${inProgressClass.room} · until ${inProgressClass.endTime}` : 'No period running right now',
          },
          {
            label: 'Classes today',
            value: todayClasses.length + todaySubstituteClasses.length,
            sub: `${completedClasses.length} done · ${todaySubstituteClasses.length} substitution${todaySubstituteClasses.length === 1 ? '' : 's'}`,
          },
          {
            label: 'Next free',
            value: inProgressClass ? `From ${inProgressClass.endTime}` : upcomingClasses[0] ? 'Now' : 'Rest of day',
            sub: upcomingClasses[0] ? `Next: ${upcomingClasses[0].subject} at ${upcomingClasses[0].startTime}` : 'No more classes today',
          },
        ]}
      />

      <section>
        <SectionLabel>Overview</SectionLabel>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Periods Today" value={todayClasses.length} context={`${clock.dayName} timetable`} pill={inProgressClass ? { label: 'In class', tone: 'live' } : { label: `${upcomingClasses.length} upcoming`, tone: 'neutral' }} onClick={() => onNavigateTab('timetable')} />
          <StatCard title="Completed" value={completedClasses.length} context={`of ${todayClasses.length} periods`} pill={{ label: `${todayClasses.length ? Math.round((completedClasses.length / todayClasses.length) * 100) : 0}% of day`, tone: 'up' }} />
          <StatCard title="Syllabus Coverage" value={`${syllabus.rate.toFixed(1)}%`} context="Modules completed" pill={{ label: `${syllabus.completed}/${syllabus.total} done`, tone: 'up' }} onClick={() => onNavigateTab('dashboard')} />
          <StatCard title="Substitutions" value={todaySubstituteClasses.length} context="Covering for colleagues" pill={todaySubstituteClasses.length ? { label: 'Assigned today', tone: 'down' } : { label: 'None today', tone: 'neutral' }} onClick={() => onNavigateTab('leave')} />
        </div>
      </section>

      {/* Main Grid: Hero Card + Side Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Hero Card: 2 columns on desktop */}
        <div className="lg:col-span-2 space-y-5">
          {/* Active / Current Status Spotlight */}
          <div
            className="p-5 sm:p-5.5 rounded-2xl border text-white shadow-md relative overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${currentTheme.primaryHex}, ${currentTheme.deepHex})`,
            }}
          >
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full text-white/95">
                  Today&apos;s Teaching Directive
                </span>
                <span className="text-[11px] font-mono font-semibold text-white/80">
                  {todayClasses.length} Scheduled Periods
                </span>
              </div>

              {inProgressClass ? (
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white text-blue-900 text-[11px] font-bold mb-2 shadow-xs animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                    <span>In Progress Now ({inProgressClass.startTime} – {inProgressClass.endTime})</span>
                  </div>
                  <h3 className="text-xl font-bold">{inProgressClass.subject}</h3>
                  <div className="flex items-center gap-3 mt-1.5 text-[11px] font-medium text-blue-100 flex-wrap">
                    <span>Sem {inProgressClass.semester} · {inProgressClass.section}</span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {inProgressClass.room}
                    </span>
                    <span>·</span>
                    <span className="font-mono">{inProgressClass.subjectCode}</span>
                  </div>
                </div>
              ) : upcomingClasses.length > 0 ? (
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-semibold mb-1.5">
                    <Clock className="w-3 h-3" />
                    <span>Next: {upcomingClasses[0].startTime} ({upcomingClasses[0].subject})</span>
                  </div>
                  <h3 className="text-lg font-bold">You are currently between instructional periods.</h3>
                  <p className="text-[11px] text-blue-100/90 mt-0.5">
                    Your next session begins at <span className="font-mono font-bold">{upcomingClasses[0].startTime}</span> in {upcomingClasses[0].room}.
                  </p>
                </div>
              ) : (
                <div>
                  <h3 className="text-lg font-bold">All teaching periods completed for today!</h3>
                  <p className="text-[11px] text-blue-100/90 mt-0.5">
                    No further classes remaining for {clock.dayName}. You can audit and update your syllabus modules.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Live List of Today's Classes */}
          <div className="bg-white rounded-2xl border border-[#dce8f7] p-4.5 sm:p-5 shadow-[0_10px_30px_rgba(31,76,126,0.06)]">
            <div className="flex items-center justify-between mb-3.5 pb-2.5 border-b border-[#eaf2fc]">
              <h3 className="text-[13px] font-bold text-[#10233f] flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-600" />
                <span>Your Classes Today</span>
              </h3>
              <button
                onClick={() => onNavigateTab('timetable')}
                className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
              >
                <span>Full Timetable</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {todayClasses.length === 0 ? (
              <div className="text-center py-10 text-xs text-[#657894]">
                No lectures or lab sessions scheduled for {clock.dayName}.
              </div>
            ) : (
              <div className="space-y-3">
                {todayClasses.map((cls, idx) => {
                  const status = getPeriodStatus(cls);

                  return (
                    <div
                      key={idx}
                      className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        status === 'In Progress'
                          ? 'border-2 border-blue-400 bg-blue-50/50 shadow-xs'
                          : status === 'Done'
                          ? 'border-[#e2ecf9] bg-[#f8fbff] opacity-80'
                          : 'border-[#dce8f7] bg-white'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center font-mono font-bold text-xs shrink-0"
                          style={{
                            backgroundColor:
                              status === 'In Progress'
                                ? currentTheme.lightHex
                                : '#eef5ff',
                            color:
                              status === 'In Progress'
                                ? currentTheme.deepHex
                                : '#657894',
                          }}
                        >
                          P{cls.periodNumber}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-[#10233f] text-sm">
                              {cls.subject}
                            </h4>
                            <span className="text-[11px] font-mono text-[#657894]">
                              {cls.subjectCode}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-[#657894] mt-1 flex-wrap">
                            <span className="font-semibold text-[#10233f]">
                              Sem {cls.semester} · {cls.section}
                            </span>
                            <span>·</span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {cls.room}
                            </span>
                            <span>·</span>
                            <span className="font-mono text-[#10233f] font-semibold">
                              {cls.startTime} – {cls.endTime}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Status Chip */}
                      <div className="self-end sm:self-center shrink-0">
                        {status === 'In Progress' && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                            <PlayCircle className="w-3.5 h-3.5 text-blue-600 animate-spin" />
                            <span>In Progress</span>
                          </span>
                        )}
                        {status === 'Upcoming' && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                            <Clock className="w-3.5 h-3.5 text-slate-500" />
                            <span>Upcoming</span>
                          </span>
                        )}
                        {status === 'Done' && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Completed</span>
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Assigned Substitute Classes Today */}
                {todaySubstituteClasses.map((subItem, idx) => (
                  <div
                    key={`sub-${idx}`}
                    className="p-3.5 rounded-xl border-2 border-dashed border-amber-400 bg-amber-50/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center font-mono font-bold text-xs shrink-0 shadow-xs">
                        P{subItem.sub.periodNumber}
                      </div>

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-[#10233f] text-xs sm:text-sm">
                            {subItem.sub.subject}
                          </h4>
                          <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-amber-500 text-white shadow-2xs">
                            Substitute Duty
                          </span>
                        </div>
                        <div className="text-[11px] font-bold text-amber-800 mt-0.5">
                          Covering for {subItem.requestingFacultyName} (Sem {subItem.sub.semester} · {subItem.sub.section})
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-[#657894] mt-0.5">
                          <Clock className="w-3 h-3 text-amber-600" />
                          <span>{subItem.sub.startTime}–{subItem.sub.endTime}</span>
                        </div>
                      </div>
                    </div>

                    <div className="self-end sm:self-center shrink-0">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse" />
                        <span>Assigned Peer Class</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Side Card: Today's Timeline (Chronological List of Periods) */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-[#dce8f7] p-5 sm:p-6 shadow-[0_10px_30px_rgba(31,76,126,0.06)]">
            <h3 className="text-sm font-bold text-[#10233f] mb-1 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>Today&apos;s Chronological Timeline</span>
            </h3>
            <p className="text-xs text-[#657894] mb-4">
              Sequence of academic blocks for {clock.dayName}
            </p>

            <div className="relative pl-6 space-y-5 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#dce8f7]">
              {todayClasses.map((cls, idx) => {
                const status = getPeriodStatus(cls);
                const isCurrent = status === 'In Progress';
                const isDone = status === 'Done';

                return (
                  <div key={idx} className="relative">
                    {/* Node dot on line */}
                    <div
                      className={`absolute -left-6 top-1 w-3 h-3 rounded-full border-2 border-white shadow-xs transition-transform ${
                        isCurrent
                          ? 'bg-blue-600 scale-125 ring-2 ring-blue-300'
                          : isDone
                          ? 'bg-emerald-500'
                          : 'bg-slate-300'
                      }`}
                    />

                    <div>
                      <div className="flex items-center justify-between text-xs mb-0.5">
                        <span className="font-mono font-bold text-[#10233f]">
                          {cls.startTime} – {cls.endTime}
                        </span>
                        <span className="text-[10px] font-bold text-[#657894]">
                          Period {cls.periodNumber}
                        </span>
                      </div>
                      <p className="font-bold text-xs text-[#10233f] leading-snug">
                        {cls.subject}
                      </p>
                      <p className="text-[11px] text-[#657894] mt-0.5">
                        {cls.section} · {cls.room}
                      </p>
                    </div>
                  </div>
                );
              })}

              {todayClasses.length === 0 && (
                <p className="text-xs text-[#657894]">No chronological blocks.</p>
              )}
            </div>
          </div>

          {/* Quick Syllabus Status preview link */}
          <div
            onClick={() => onNavigateTab('dashboard')}
            className="p-5 rounded-2xl border border-[#dce8f7] bg-white card-lift cursor-pointer shadow-[0_8px_24px_rgba(31,76,126,0.06)] flex items-center justify-between"
          >
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#657894] block">
                Course Progress
              </span>
              <span className="font-bold text-xs text-[#10233f]">
                Manage Module Checklists
              </span>
            </div>
            <ArrowRight className="w-4 h-4 text-blue-600" />
          </div>
        </div>
      </div>
    </div>
  );
};
