import React, { useMemo, useState } from 'react';
import { CalendarDays, MessageSquareText, UserCheck, Users } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ClassSession, WeekDay } from '../../types';

const DAYS: WeekDay[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Session outcome colours (validated with the dataviz palette checker; always shown with labels)
const OUTCOME = {
  completed: { label: 'Held', color: '#2563eb' },
  substituted: { label: 'Substituted', color: '#d08a1e' },
  cancelled: { label: 'Cancelled', color: '#c9443c' },
} as const;
type Outcome = keyof typeof OUTCOME;

const Card: React.FC<{ icon: React.ElementType; title: string; subtitle: string; action?: React.ReactNode; children: React.ReactNode }> = ({ icon: Icon, title, subtitle, action, children }) => (
  <section className="rounded-2xl border border-[#dce8f7] bg-white p-4.5 shadow-[0_10px_30px_rgba(31,76,126,0.06)] sm:p-5">
    <div className="mb-3.5 flex items-start justify-between gap-3 border-b border-[#eaf2fc] pb-2.5">
      <div className="flex items-start gap-2.5">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#2563eb] to-[#1d4ed8] text-white shadow-xs">
          <Icon className="h-3.5 w-3.5" />
        </span>
        <div>
          <h3 className="text-[13px] font-bold text-[#10233f]">{title}</h3>
          <p className="mt-0.5 text-[11px] text-[#657894]">{subtitle}</p>
        </div>
      </div>
      {action}
    </div>
    {children}
  </section>
);

const Legend: React.FC = () => (
  <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#475569]">
    {(Object.keys(OUTCOME) as Outcome[]).map((k) => (
      <span key={k} className="inline-flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: OUTCOME[k].color }} />
        {OUTCOME[k].label}
      </span>
    ))}
  </div>
);

/** Classes this week: one stacked column per day (held / substituted / cancelled) with attendance under it. */
export const WeeklyClassesChart: React.FC = () => {
  const { sessions, clock } = useApp();
  const [hover, setHover] = useState<string | null>(null);

  const days = useMemo(() => {
    const byDay = DAYS.map((day) => {
      const list = sessions.filter((s) => s.day === day);
      const count = (st: Outcome) => list.filter((s) => s.status === st).length;
      const held = list.filter((s) => s.status === 'completed' || s.status === 'substituted');
      const present = held.reduce((n, s) => n + (s.studentsPresent ?? 0), 0);
      const strength = held.reduce((n, s) => n + (s.strength ?? 0), 0);
      return {
        day,
        date: list[0]?.date ?? '',
        total: list.length,
        completed: count('completed'),
        substituted: count('substituted'),
        cancelled: count('cancelled'),
        attendance: strength ? Math.round((present / strength) * 100) : null,
        notes: list.filter((s) => s.status !== 'completed') as ClassSession[],
      };
    });
    return byDay.filter((d) => d.total > 0);
  }, [sessions]);

  const max = Math.max(...days.map((d) => d.total), 1);
  const totals = days.reduce(
    (t, d) => ({ held: t.held + d.completed, sub: t.sub + d.substituted, cancel: t.cancel + d.cancelled }),
    { held: 0, sub: 0, cancel: 0 }
  );
  const all = totals.held + totals.sub + totals.cancel;
  const active = days.find((d) => d.day === hover);
  const BAR_H = 150;

  return (
    <Card
      icon={CalendarDays}
      title="Classes this week"
      subtitle={`${all} scheduled · ${totals.held + totals.sub} held (${all ? Math.round(((totals.held + totals.sub) / all) * 100) : 0}%) · ${totals.cancel} cancelled`}
      action={<Legend />}
    >
      <div className="relative">
        <div className="flex items-end justify-around gap-3 border-b border-[#dce8f7]" style={{ height: BAR_H + 24 }}>
          {days.map((d) => {
            const isToday = d.date === clock.dateStr;
            return (
              <button
                key={d.day}
                onMouseEnter={() => setHover(d.day)}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(d.day)}
                onBlur={() => setHover(null)}
                className="group relative flex h-full w-full max-w-[72px] flex-col items-center justify-end"
                aria-label={`${d.day}: ${d.completed} held, ${d.substituted} substituted, ${d.cancelled} cancelled`}
              >
                <span className="mb-1 text-[12px] font-semibold tabular-nums text-[#10233f]">{d.total}</span>
                {/* stacked from the baseline up; 2px surface gaps between segments */}
                <span className="flex w-9 flex-col-reverse gap-[2px]" style={{ height: (d.total / max) * BAR_H }}>
                  {(['completed', 'substituted', 'cancelled'] as Outcome[]).map((k, i, arr) =>
                    d[k] > 0 ? (
                      <span
                        key={k}
                        className={`w-full transition-opacity ${hover && hover !== d.day ? 'opacity-40' : ''} ${i === arr.length - 1 || arr.slice(i + 1).every((x) => d[x] === 0) ? 'rounded-t' : ''}`}
                        style={{ flexGrow: d[k], backgroundColor: OUTCOME[k].color }}
                      />
                    ) : null
                  )}
                </span>
                {isToday && <span className="absolute -bottom-0.5 h-0.5 w-9 bg-[#2563eb]" />}
              </button>
            );
          })}
        </div>
        <div className="mt-2 flex justify-around gap-3">
          {days.map((d) => (
            <div key={d.day} className="w-full max-w-[72px] text-center">
              <p className={`text-[12px] font-semibold ${d.date === clock.dateStr ? 'text-[#10233f]' : 'text-[#475569]'}`}>{d.day.slice(0, 3)}{d.date === clock.dateStr ? ' · Today' : ''}</p>
              <p className="text-[11px] text-[#657894]">{d.attendance !== null ? `${d.attendance}% present` : '—'}</p>
            </div>
          ))}
        </div>

        {active && (
          <div className="pointer-events-none absolute right-0 top-0 z-10 w-60 rounded-xl border border-[#dce8f7] bg-white p-3 text-[12px] shadow-[0_12px_30px_rgba(0,0,0,0.12)]">
            <p className="font-bold text-[#10233f]">{active.day} · {active.date}</p>
            <div className="mt-1.5 space-y-0.5 text-[#334155]">
              {(Object.keys(OUTCOME) as Outcome[]).map((k) => (
                <p key={k} className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm" style={{ backgroundColor: OUTCOME[k].color }} />{OUTCOME[k].label}</span>
                  <span className="font-semibold tabular-nums">{active[k]}</span>
                </p>
              ))}
              <p className="flex justify-between border-t border-[#f0f5fc] pt-1"><span>Attendance</span><span className="font-semibold">{active.attendance ?? '—'}%</span></p>
            </div>
            {active.notes.map((n) => (
              <p key={n.id} className="mt-1.5 text-[11px] text-[#657894]">{n.periodLabel} {n.subject}: {n.remarks}</p>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};

/** Teaching load: ranked horizontal bars, one per faculty, with the department average marked. */
export const TeachingLoadChart: React.FC<{ onOpenFaculty: (id: string) => void }> = ({ onOpenFaculty }) => {
  const { facultyList } = useApp();
  const [hover, setHover] = useState<string | null>(null);

  const rows = useMemo(
    () =>
      facultyList
        .map((f) => ({
          id: f.id,
          name: f.name,
          periods: f.timetable.length,
          days: new Set(f.timetable.map((t) => t.day)).size,
          courses: Array.from(new Set(f.timetable.map((t) => t.subjectCode))),
        }))
        .sort((a, b) => b.periods - a.periods),
    [facultyList]
  );
  const max = Math.max(...rows.map((r) => r.periods), 1);
  const avg = rows.length ? rows.reduce((n, r) => n + r.periods, 0) / rows.length : 0;

  return (
    <Card icon={Users} title="Teaching load per faculty" subtitle={`Periods per week from the timetable · average ${avg.toFixed(1)}`}>
      <div className="space-y-2">
        {rows.map((r) => (
          <button
            key={r.id}
            onClick={() => onOpenFaculty(r.id)}
            onMouseEnter={() => setHover(r.id)}
            onMouseLeave={() => setHover(null)}
            className="grid w-full grid-cols-[140px_1fr_auto] items-center gap-3 rounded-md px-1 py-0.5 text-left hover:bg-[#f8fbff] sm:grid-cols-[170px_1fr_auto]"
          >
            <span className="truncate text-[13px] text-[#10233f]">{r.name}</span>
            <span className="relative h-5">
              <span
                className={`absolute inset-y-0 left-0 rounded-r transition-opacity ${hover && hover !== r.id ? 'opacity-40' : ''}`}
                style={{ width: `${(r.periods / max) * 100}%`, background: 'linear-gradient(90deg, #2563eb, #1d4ed8)' }}
              />
              {/* average marker */}
              <span className="absolute inset-y-[-3px] w-px bg-[#10233f]/40" style={{ left: `${(avg / max) * 100}%` }} />
            </span>
            <span className="w-24 text-right text-[12px] tabular-nums text-[#334155]">
              {hover === r.id ? `${r.days} days · ${r.courses.join(', ')}` : `${r.periods} periods`}
            </span>
          </button>
        ))}
      </div>
      <p className="mt-3 flex items-center gap-1.5 text-[11px] text-[#657894]">
        <span className="inline-block h-3 w-px bg-[#10233f]/40" /> Average load · click a name to open the profile
      </p>
    </Card>
  );
};

/** Campus presence today, straight from faculty_presence. Numbers, not a chart. */
export const CampusPresenceCard: React.FC = () => {
  const { facultyList, getFacultyPresence, clock } = useApp();
  const records = facultyList.map((f) => ({ f, p: getFacultyPresence(f.id) }));
  const count = (st: string) => records.filter((r) => r.p?.status === st).length;
  const noRecord = records.filter((r) => !r.p).length;

  return (
    <Card icon={UserCheck} title="Campus presence" subtitle={`Check-ins for ${clock.dayName}, ${clock.dateStr}`}>
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'In campus', value: count('In Campus'), tone: 'text-[#047857]' },
          { label: 'Off campus', value: count('Off Campus'), tone: 'text-[#475569]' },
          { label: 'On leave', value: count('On Leave'), tone: 'text-amber-700' },
        ].map((t) => (
          <div key={t.label} className="rounded-xl border border-[#e2ecf9] bg-[#f9fcff] px-3 py-2.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#657894]">{t.label}</p>
            <p className={`font-mono text-xl font-extrabold tabular-nums ${t.tone}`}>{t.value}</p>
          </div>
        ))}
      </div>
      {noRecord === records.length ? (
        <p className="mt-3 rounded-lg border border-dashed border-[#bfdbfe] px-3 py-4 text-center text-[12px] text-[#657894]">No check-in records for this date.</p>
      ) : (
        <div className="mt-3 max-h-[220px] space-y-1 overflow-y-auto">
          {records.map(({ f, p }) => (
            <div key={f.id} className="flex items-center justify-between rounded-md px-2 py-1.5 text-[12px] hover:bg-[#f8fbff]">
              <span className="flex items-center gap-2 text-[#10233f]">
                <span className={`h-1.5 w-1.5 rounded-full ${p?.status === 'In Campus' ? 'bg-[#2563eb]' : p?.status === 'On Leave' ? 'bg-[#d08a1e]' : 'bg-[#94a3b8]'}`} />
                {f.name}
              </span>
              <span className="tabular-nums text-[#657894]">{p?.checkIn ? `${p.checkIn} – ${p.checkOut} · ${p.room}` : p?.status ?? 'No record'}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};

/** Course feedback list (v_feedback_list): Done / Pending with rating. */
export const CourseFeedbackCard: React.FC = () => {
  const { feedback } = useApp();
  const done = feedback.filter((f) => f.status === 'Done');
  const avg = done.length ? done.reduce((n, f) => n + (f.avgRating ?? 0), 0) / done.length : 0;

  return (
    <Card
      icon={MessageSquareText}
      title="Course feedback"
      subtitle={`${done.length} of ${feedback.length} courses collected · average rating ${avg.toFixed(1)} / 5`}
    >
      <div className="overflow-x-auto">
        <table className="data-table w-full min-w-[560px] border-collapse text-left">
          <thead>
            <tr className="border-b border-[#eaf2fc]">
              <th className="py-2.5 pr-3">Course</th>
              <th className="py-2.5 pr-3">Faculty</th>
              <th className="py-2.5 pr-3">Section</th>
              <th className="py-2.5 pr-3">Status</th>
              <th className="py-2.5 text-right">Rating</th>
            </tr>
          </thead>
          <tbody>
            {feedback.map((f) => (
              <tr key={f.assignmentId} className="border-b border-[#f0f6ff] last:border-0 hover:bg-[#f9fcff]">
                <td className="py-2 pr-3">
                  <p className="font-semibold text-[#10233f]">{f.courseTitle}</p>
                  <p className="text-[11px] text-[#657894]">{f.courseCode} · {f.category}</p>
                </td>
                <td className="py-2 pr-3 text-[#334155]">{f.facultyName}</td>
                <td className="whitespace-nowrap py-2 pr-3 text-[#334155]">{f.sectionLabel}</td>
                <td className="py-2 pr-3">
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${f.status === 'Done' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700'}`}>{f.status}</span>
                </td>
                <td className="py-2 text-right tabular-nums text-[#10233f]">
                  {f.avgRating !== null ? (
                    <span className="inline-flex items-center justify-end gap-2">
                      <span className="hidden h-1.5 w-16 overflow-hidden rounded-full bg-[#eaf2fc] sm:inline-block">
                        <span className="block h-full rounded-full bg-[#1d4ed8]" style={{ width: `${(f.avgRating / 5) * 100}%` }} />
                      </span>
                      {f.avgRating.toFixed(1)} <span className="text-[11px] text-[#657894]">({f.responses})</span>
                    </span>
                  ) : (
                    <span className="text-[#94a3b8]">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};
