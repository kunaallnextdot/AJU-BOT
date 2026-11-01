import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { FacultyMember } from '../../types';
import {
  Clock,
  BookOpen,
  MapPin,
  CheckCircle2,
  PlayCircle,
  ArrowRight,
} from 'lucide-react';
import { LiveStrip, SectionLabel, StatCard } from '../common/ui';

interface FacultyMyDayProps {
  faculty: FacultyMember;
  onNavigateTab: (tab: string) => void;
}

type PeriodStatus = 'Upcoming' | 'In Progress' | 'Done';

/** A regular timetable period or a substitution, normalised so both share the live-status logic. */
interface DayPeriod {
  key: string;
  periodNumber: number;
  startTime: string;
  endTime: string;
  subject: string;
  subjectCode?: string;
  semester: number;
  section: string;
  room?: string;
  coveringFor?: string;
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const timeToMins = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

const pad = (n: number) => n.toString().padStart(2, '0');
const toDateStr = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseDate = (s: string) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};
const shortDate = (s: string) => parseDate(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

export const FacultyMyDay: React.FC<FacultyMyDayProps> = ({ faculty, onNavigateTab }) => {
  const { clock, currentTheme, leaveRequests, holidays } = useApp();

  const getGreeting = () => {
    const hour = parseInt(clock.timeStr.split(':')[0], 10);
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const currentMins = timeToMins(clock.timeStr);

  // Why a date has no teaching: Sunday, a calendar holiday, or the faculty's own approved leave
  const offReason = (dateStr: string, dayName: string): string | null => {
    if (dayName === 'Sunday') return 'Sunday';
    const holiday = holidays.find((h) => h.date === dateStr && h.type !== 'observance');
    if (holiday) return holiday.title;
    const onLeave = leaveRequests.some(
      (l) => l.facultyId === faculty.id && l.status === 'Approved' && dateStr >= l.fromDate && dateStr <= l.toDate
    );
    return onLeave ? 'On approved leave' : null;
  };

  // Regular classes plus substitute duty for one date, in time order
  const periodsFor = (dateStr: string, dayName: string): DayPeriod[] => {
    if (offReason(dateStr, dayName)) return [];
    const regular: DayPeriod[] = faculty.timetable
      .filter((c) => c.day === dayName)
      .map((c) => ({
        key: `p-${c.periodNumber}-${c.section}`,
        periodNumber: c.periodNumber,
        startTime: c.startTime,
        endTime: c.endTime,
        subject: c.subject,
        subjectCode: c.subjectCode,
        semester: c.semester,
        section: c.section,
        room: c.room,
      }));
    const substitutes: DayPeriod[] = leaveRequests
      .filter((req) => req.status === 'Approved' || req.status === 'Pending')
      .flatMap((req) =>
        req.substitutions
          .filter((s) => s.substituteFacultyId === faculty.id && s.date === dateStr && s.status !== 'Rejected')
          .map((s) => ({
            key: `s-${req.id}-${s.periodNumber}`,
            periodNumber: s.periodNumber,
            startTime: s.startTime,
            endTime: s.endTime,
            subject: s.subject,
            semester: s.semester,
            section: s.section,
            room: s.room,
            coveringFor: req.facultyName,
          }))
      );
    return [...regular, ...substitutes].sort((a, b) => timeToMins(a.startTime) - timeToMins(b.startTime));
  };

  const todayPeriods = useMemo(
    () => periodsFor(clock.dateStr, clock.dayName),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [faculty, leaveRequests, holidays, clock.dateStr, clock.dayName]
  );
  const todayOff = offReason(clock.dateStr, clock.dayName);

  // End time is exclusive so back-to-back periods (08:00–08:45, 08:45–09:30) never overlap
  const getPeriodStatus = (p: DayPeriod): PeriodStatus => {
    if (currentMins < timeToMins(p.startTime)) return 'Upcoming';
    if (currentMins < timeToMins(p.endTime)) return 'In Progress';
    return 'Done';
  };

  const inProgress = todayPeriods.find((p) => getPeriodStatus(p) === 'In Progress');
  const upcoming = todayPeriods.filter((p) => getPeriodStatus(p) === 'Upcoming');
  const completed = todayPeriods.filter((p) => getPeriodStatus(p) === 'Done');
  const substituteCount = todayPeriods.filter((p) => p.coveringFor).length;

  // Once nothing is left today, look ahead to the next day that actually has classes
  const nextTeachingDay = useMemo(() => {
    if (inProgress || upcoming.length) return null;
    const d = parseDate(clock.dateStr);
    for (let i = 1; i <= 21; i++) {
      d.setDate(d.getDate() + 1);
      const dateStr = toDateStr(d);
      const dayName = DAY_NAMES[d.getDay()];
      const periods = periodsFor(dateStr, dayName);
      if (periods.length) return { dateStr, dayName, periods, isTomorrow: i === 1 };
    }
    return null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [faculty, leaveRequests, holidays, clock.dateStr, !!inProgress, upcoming.length]);

  const nextDayLabel = nextTeachingDay
    ? `${nextTeachingDay.isTomorrow ? 'Tomorrow' : nextTeachingDay.dayName}, ${shortDate(nextTeachingDay.dateStr)}`
    : '';
  const nextFirst = nextTeachingDay?.periods[0];

  // The class list shows today; on an empty day it previews the next teaching day instead
  const showingNextDay = todayPeriods.length === 0 && !!nextTeachingDay;
  const listedPeriods = showingNextDay ? nextTeachingDay!.periods : todayPeriods;
  const listedStatus = (p: DayPeriod): PeriodStatus => (showingNextDay ? 'Upcoming' : getPeriodStatus(p));
  const listedDayName = showingNextDay ? nextTeachingDay!.dayName : clock.dayName;

  const syllabus = (() => {
    const modules = faculty.subjects.flatMap((subject) => subject.modules);
    const done = modules.filter((m) => m.completed).length;
    return { total: modules.length, completed: done, rate: modules.length ? (done / modules.length) * 100 : 0 };
  })();

  const nextClassItem = inProgress
    ? { value: upcoming[0] ? upcoming[0].subject : 'Free after this', sub: upcoming[0] ? `P${upcoming[0].periodNumber} at ${upcoming[0].startTime} · ${upcoming[0].room ?? upcoming[0].section}` : `Done for today at ${inProgress.endTime}` }
    : upcoming[0]
    ? { value: upcoming[0].subject, sub: `P${upcoming[0].periodNumber} at ${upcoming[0].startTime} · ${upcoming[0].room ?? upcoming[0].section}` }
    : nextFirst
    ? { value: nextFirst.subject, sub: `${nextDayLabel} · ${nextFirst.startTime}` }
    : { value: 'None scheduled', sub: 'No upcoming classes found' };

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
            {todayOff && <span> · {todayOff === 'Sunday' ? 'weekly off' : todayOff}</span>}
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
            value: inProgress ? inProgress.subject : 'Not teaching',
            sub: inProgress
              ? `${inProgress.coveringFor ? 'Substitute · ' : ''}${inProgress.section}${inProgress.room ? ` · ${inProgress.room}` : ''} · until ${inProgress.endTime}`
              : todayOff
              ? `No classes today (${todayOff === 'Sunday' ? 'weekly off' : todayOff})`
              : upcoming[0]
              ? `Free until ${upcoming[0].startTime}`
              : 'No period running right now',
          },
          {
            label: 'Classes today',
            value: todayPeriods.length,
            sub: `${completed.length} done · ${upcoming.length} left · ${substituteCount} substitution${substituteCount === 1 ? '' : 's'}`,
          },
          { label: 'Next class', ...nextClassItem },
        ]}
      />

      <section>
        <SectionLabel>Overview</SectionLabel>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Periods Today"
            value={todayPeriods.length}
            context={todayOff ? `${clock.dayName} · no classes` : `${clock.dayName} timetable`}
            pill={inProgress ? { label: 'In class', tone: 'live' } : todayPeriods.length ? { label: `${upcoming.length} upcoming`, tone: 'neutral' } : nextTeachingDay ? { label: `Next: ${nextTeachingDay.dayName.slice(0, 3)}`, tone: 'neutral' } : { label: 'Off', tone: 'neutral' }}
            onClick={() => onNavigateTab('timetable')}
          />
          <StatCard
            title="Completed"
            value={completed.length}
            context={`of ${todayPeriods.length} periods`}
            pill={todayPeriods.length ? { label: `${Math.round((completed.length / todayPeriods.length) * 100)}% of day`, tone: 'up' } : { label: 'No classes', tone: 'neutral' }}
          />
          <StatCard title="Syllabus Coverage" value={`${syllabus.rate.toFixed(1)}%`} context="Modules completed" pill={{ label: `${syllabus.completed}/${syllabus.total} done`, tone: 'up' }} onClick={() => onNavigateTab('dashboard')} />
          <StatCard title="Substitutions" value={substituteCount} context="Covering for colleagues" pill={substituteCount ? { label: 'Assigned today', tone: 'down' } : { label: 'None today', tone: 'neutral' }} onClick={() => onNavigateTab('leave')} />
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
              <div className="flex items-center justify-between gap-2 mb-2.5">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full text-white/95">
                  Today&apos;s Teaching Directive
                </span>
                <span className="text-[11px] font-mono font-semibold text-white/80">
                  {completed.length}/{todayPeriods.length} periods done
                </span>
              </div>

              {inProgress ? (
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white text-blue-900 text-[11px] font-bold mb-2 shadow-xs animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                    <span>Go to class now · P{inProgress.periodNumber} ({inProgress.startTime} – {inProgress.endTime})</span>
                  </div>
                  <h3 className="text-xl font-bold">{inProgress.subject}</h3>
                  <div className="flex items-center gap-3 mt-1.5 text-[11px] font-medium text-blue-100 flex-wrap">
                    <span>Sem {inProgress.semester} · {inProgress.section}</span>
                    {inProgress.room && (
                      <>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {inProgress.room}
                        </span>
                      </>
                    )}
                    {inProgress.coveringFor ? (
                      <>
                        <span>·</span>
                        <span>Covering for {inProgress.coveringFor}</span>
                      </>
                    ) : inProgress.subjectCode ? (
                      <>
                        <span>·</span>
                        <span className="font-mono">{inProgress.subjectCode}</span>
                      </>
                    ) : null}
                  </div>
                </div>
              ) : upcoming.length > 0 ? (
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-semibold mb-1.5">
                    <Clock className="w-3 h-3" />
                    <span>Next: P{upcoming[0].periodNumber} at {upcoming[0].startTime}</span>
                  </div>
                  <h3 className="text-lg font-bold">
                    {completed.length ? 'Free period right now' : 'Your first class today'}: {upcoming[0].subject}
                  </h3>
                  <p className="text-[11px] text-blue-100/90 mt-0.5">
                    Sem {upcoming[0].semester} · {upcoming[0].section}
                    {upcoming[0].room && <> in <span className="font-bold">{upcoming[0].room}</span></>}
                    {' '}at <span className="font-mono font-bold">{upcoming[0].startTime}</span>
                    {upcoming[0].coveringFor && <> (covering for {upcoming[0].coveringFor})</>}
                  </p>
                </div>
              ) : (
                <div>
                  <h3 className="text-lg font-bold">
                    {todayPeriods.length ? 'All teaching periods completed for today!' : `No classes today${todayOff ? ` — ${todayOff === 'Sunday' ? 'weekly off' : todayOff}` : ''}`}
                  </h3>
                  {nextFirst ? (
                    <p className="text-[11px] text-blue-100/90 mt-0.5">
                      Next class: <span className="font-bold">{nextDayLabel}</span> · P{nextFirst.periodNumber}{' '}
                      <span className="font-mono font-bold">{nextFirst.startTime}</span> {nextFirst.subject} (Sem {nextFirst.semester} · {nextFirst.section}
                      {nextFirst.room ? `, ${nextFirst.room}` : ''}) · {nextTeachingDay!.periods.length} period{nextTeachingDay!.periods.length === 1 ? '' : 's'} that day
                    </p>
                  ) : (
                    <p className="text-[11px] text-blue-100/90 mt-0.5">
                      You can audit and update your syllabus modules.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Live List of Today's Classes */}
          <div className="bg-white rounded-2xl border border-[#dce8f7] p-4.5 sm:p-5 shadow-[0_10px_30px_rgba(31,76,126,0.06)]">
            <div className="flex items-center justify-between gap-2 mb-3.5 pb-2.5 border-b border-[#eaf2fc]">
              <h3 className="text-[13px] font-bold text-[#10233f] flex items-center gap-2 min-w-0">
                <BookOpen className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="truncate">{showingNextDay ? `Classes ${nextDayLabel}` : 'Your Classes Today'}</span>
              </h3>
              <button
                onClick={() => onNavigateTab('timetable')}
                className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer shrink-0"
              >
                <span>Full Timetable</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {listedPeriods.length === 0 ? (
              <div className="text-center py-10 text-xs text-[#657894]">
                No lectures or lab sessions scheduled for {clock.dayName}.
              </div>
            ) : (
              <div className="space-y-3">
                {showingNextDay && (
                  <p className="text-[11px] text-[#657894]">
                    No classes today, so here is your next teaching day.
                  </p>
                )}
                {listedPeriods.map((cls) => {
                  const status = listedStatus(cls);
                  const isSub = !!cls.coveringFor;

                  return (
                    <div
                      key={cls.key}
                      className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        status === 'In Progress'
                          ? 'border-2 border-blue-400 bg-blue-50/50 shadow-xs'
                          : status === 'Done'
                          ? 'border-[#e2ecf9] bg-[#f8fbff] opacity-80'
                          : isSub
                          ? 'border-2 border-dashed border-amber-400 bg-amber-50/80'
                          : 'border-[#dce8f7] bg-white'
                      }`}
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center font-mono font-bold text-xs shrink-0"
                          style={{
                            backgroundColor: isSub ? '#f59e0b' : status === 'In Progress' ? currentTheme.lightHex : '#eef5ff',
                            color: isSub ? '#ffffff' : status === 'In Progress' ? currentTheme.deepHex : '#657894',
                          }}
                        >
                          P{cls.periodNumber}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-bold text-[#10233f] text-sm">{cls.subject}</h4>
                            {cls.subjectCode && (
                              <span className="text-[11px] font-mono text-[#657894]">{cls.subjectCode}</span>
                            )}
                            {isSub && (
                              <span className="text-[9px] font-black uppercase px-1.5 rounded bg-amber-500 text-white">
                                Substitute Duty
                              </span>
                            )}
                          </div>
                          {isSub && (
                            <div className="text-[11px] font-bold text-amber-800 mt-0.5">
                              Covering for {cls.coveringFor}
                            </div>
                          )}
                          <div className="flex items-center gap-3 text-xs text-[#657894] mt-1 flex-wrap">
                            <span className="font-semibold text-[#10233f]">
                              Sem {cls.semester} · {cls.section}
                            </span>
                            {cls.room && (
                              <>
                                <span>·</span>
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {cls.room}
                                </span>
                              </>
                            )}
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
                            <PlayCircle className="w-3.5 h-3.5 text-blue-600" />
                            <span>In Progress</span>
                          </span>
                        )}
                        {status === 'Upcoming' && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                            <Clock className="w-3.5 h-3.5 text-slate-500" />
                            <span>{showingNextDay ? listedDayName.slice(0, 3) : 'Upcoming'}</span>
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
              </div>
            )}
          </div>
        </div>

        {/* Side Card: Chronological timeline of the listed day */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-[#dce8f7] p-5 sm:p-6 shadow-[0_10px_30px_rgba(31,76,126,0.06)]">
            <h3 className="text-sm font-bold text-[#10233f] mb-1 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>{showingNextDay ? `${listedDayName}'s Timeline` : "Today's Chronological Timeline"}</span>
            </h3>
            <p className="text-xs text-[#657894] mb-4">
              Sequence of academic blocks for {listedDayName}
            </p>

            <div className="relative pl-6 space-y-5 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#dce8f7]">
              {listedPeriods.map((cls) => {
                const status = listedStatus(cls);
                const isCurrent = status === 'In Progress';
                const isDone = status === 'Done';

                return (
                  <div key={cls.key} className="relative">
                    {/* Node dot on line */}
                    <div
                      className={`absolute -left-6 top-1 w-3 h-3 rounded-full border-2 border-white shadow-xs transition-transform ${
                        isCurrent
                          ? 'bg-blue-600 scale-125 ring-2 ring-blue-300'
                          : isDone
                          ? 'bg-emerald-500'
                          : cls.coveringFor
                          ? 'bg-amber-500'
                          : 'bg-slate-300'
                      }`}
                    />

                    <div>
                      <div className="flex items-center justify-between text-xs mb-0.5">
                        <span className="font-mono font-bold text-[#10233f]">
                          {cls.startTime} – {cls.endTime}
                        </span>
                        <span className={`text-[10px] font-bold ${isCurrent ? 'text-blue-600' : 'text-[#657894]'}`}>
                          {isCurrent ? 'Now' : `Period ${cls.periodNumber}`}
                        </span>
                      </div>
                      <p className="font-bold text-xs text-[#10233f] leading-snug">
                        {cls.subject}
                      </p>
                      <p className="text-[11px] text-[#657894] mt-0.5">
                        {cls.section}{cls.room ? ` · ${cls.room}` : ''}{cls.coveringFor ? ` · for ${cls.coveringFor}` : ''}
                      </p>
                    </div>
                  </div>
                );
              })}

              {listedPeriods.length === 0 && (
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
