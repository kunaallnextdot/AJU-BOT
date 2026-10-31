import React, { useState } from 'react';
import { FacultyMember } from '../../types';
import { useApp } from '../../context/AppContext';
import {
  X,
  BookOpen,
  CheckCircle,
  Circle,
  GraduationCap,
  Clock,
  ChevronDown,
  ChevronUp,
  Lock,
  Calendar,
} from 'lucide-react';

interface FacultyDrawerProps {
  faculty: FacultyMember | null;
  onClose: () => void;
  isReadOnly?: boolean; // Admin is true, Faculty viewing own is false
}

export const FacultyDrawer: React.FC<FacultyDrawerProps> = ({
  faculty,
  onClose,
  isReadOnly = true,
}) => {
  const { facultyList, getFacultyLiveStatus, getFacultyPresence, sessions, feedback, clock, currentTheme } = useApp();
  const [expandedSubjects, setExpandedSubjects] = useState<Record<string, boolean>>({});

  if (!faculty) return null;

  // Retrieve live faculty from context to ensure real-time synchronization
  const liveFaculty = facultyList.find((f) => f.id === faculty.id) || faculty;

  const statusDetail = getFacultyLiveStatus(liveFaculty.id);
  const isTeaching = statusDetail.status === 'In Class';
  const isOnLeave = statusDetail.status === 'On Leave';

  const toggleSubject = (subId: string) => {
    setExpandedSubjects((prev) => ({
      ...prev,
      [subId]: !prev[subId],
    }));
  };

  // Calculate overall modules from live data
  const allModules = liveFaculty.subjects.flatMap((s) => s.modules);
  const completedCount = allModules.filter((m) => m.completed).length;
  const overallPercent = allModules.length
    ? Math.round((completedCount / allModules.length) * 100)
    : 0;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Dimmed backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-lg bg-white shadow-2xl flex flex-col border-l border-[#dce8f7] animate-in slide-in-from-right duration-200">
          {/* Header */}
          <div className="p-6 border-b border-[#eaf2fc] bg-gradient-to-b from-[#f8fbff] to-white relative">
            <button
              onClick={onClose}
              className="absolute top-5 right-5 p-2 rounded-xl text-[#657894] hover:text-[#10233f] hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Close panel"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-4">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center font-bold text-lg text-white shadow-md shrink-0"
                style={{
                  background: `linear-gradient(135deg, ${currentTheme.primaryHex}, ${currentTheme.deepHex})`,
                }}
              >
                {faculty.avatarInitials}
              </div>
              <div className="min-w-0 pr-8">
                <h3 className="text-base font-bold text-[#10233f] leading-snug">
                  {faculty.name}
                </h3>
                <p className="text-[11px] font-semibold text-[#657894]">
                  {faculty.position}
                </p>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700">
                    {faculty.department} ({faculty.deptShort})
                  </span>

                  {/* Live Status Chip */}
                  {isTeaching ? (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-ping" />
                      In Class ({statusDetail.currentClass?.subjectCode})
                    </span>
                  ) : isOnLeave ? (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      On Leave
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Free
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Read-Only Notice for Admin */}
            {isReadOnly && (
              <div className="mt-4 p-2.5 rounded-xl bg-[#eef5ff] border border-[#dce8f7] flex items-center gap-2 text-xs text-[#657894]">
                <Lock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>
                  Admin audit view: Module checkboxes are <strong>read-only</strong>. Only {faculty.name.split(' ')[0]} can mark completion.
                </span>
              </div>
            )}
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Overall Syllabus Progress Card */}
            <div className="p-4 rounded-xl border border-[#dce8f7] bg-[#f8fbff]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#657894]">
                  Overall Syllabus Completion
                </span>
                <span className="text-xs font-mono font-bold text-[#10233f]">
                  {completedCount} of {allModules.length} Modules ({overallPercent}%)
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${overallPercent}%`,
                    backgroundColor: currentTheme.primaryHex,
                  }}
                />
              </div>
            </div>

            {/* Subjects Accordion by Semester -> Section -> Subject */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#657894] flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-blue-600" />
                <span>Curriculum & Syllabus Modules</span>
              </h4>

              {liveFaculty.subjects.map((subject) => {
                const isExpanded = expandedSubjects[subject.id] ?? true; // default open
                const subCompleted = subject.modules.filter((m) => m.completed).length;
                const subPercent = subject.modules.length
                  ? Math.round((subCompleted / subject.modules.length) * 100)
                  : 0;

                return (
                  <div
                    key={subject.id}
                    className="rounded-xl border border-[#dce8f7] bg-white overflow-hidden shadow-xs"
                  >
                    {/* Subject Header / Trigger */}
                    <button
                      onClick={() => toggleSubject(subject.id)}
                      className="w-full text-left p-4 hover:bg-[#f8fbff] transition-colors flex items-center justify-between cursor-pointer"
                    >
                      <div className="min-w-0 pr-4">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-mono">
                            Sem {subject.semester} · {subject.section}
                          </span>
                          <span className="text-xs font-mono font-bold text-[#657894]">
                            {subject.code}
                          </span>
                        </div>
                        <h5 className="font-bold text-[#10233f] text-sm">
                          {subject.name}
                        </h5>
                        <div className="mt-2 flex items-center gap-3">
                          <div className="w-32 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${subPercent}%`,
                                backgroundColor: currentTheme.primaryHex,
                              }}
                            />
                          </div>
                          <span className="text-[11px] font-mono font-semibold text-[#657894]">
                            {subCompleted}/{subject.modules.length} ({subPercent}%)
                          </span>
                        </div>
                      </div>

                      <div className="p-1 rounded-lg text-[#657894] hover:bg-slate-100">
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </div>
                    </button>

                    {/* Module Checklist (Read-Only in Admin View) */}
                    {isExpanded && (
                      <div className="p-4 pt-1 border-t border-[#eef5ff] bg-[#f8fbff] space-y-2">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-[#8494aa] mb-2">
                          Unit Breakdown:
                        </div>
                        {subject.modules.map((module, idx) => (
                          <div
                            key={module.id}
                            className={`p-2.5 rounded-lg border text-xs flex items-center gap-3 transition-colors ${
                              module.completed
                                ? 'bg-emerald-50/60 border-emerald-200/70 text-emerald-900'
                                : 'bg-white border-[#e2ecf9] text-[#10233f]'
                            }`}
                          >
                            {module.completed ? (
                              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                            ) : (
                              <Circle className="w-4 h-4 text-slate-300 shrink-0" />
                            )}
                            <div className="flex-1">
                              <span className={`font-medium ${module.completed ? 'line-through text-emerald-800/80' : ''}`}>
                                {module.name}
                              </span>
                            </div>
                            <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded bg-white border border-[#dce8f7] text-[#657894]">
                              {module.completed ? 'Done' : 'Pending'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Quick Timetable Summary */}
            <div className="p-4 rounded-xl border border-[#dce8f7] bg-white">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#657894] mb-3 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-blue-600" />
                <span>Weekly Teaching Schedule Summary</span>
              </h4>
              <div className="text-xs text-[#10233f] space-y-1.5">
                <div className="flex justify-between py-1 border-b border-[#eef5ff]">
                  <span className="text-[#657894]">Total Classes per Week</span>
                  <span className="font-bold font-mono">{faculty.timetable.length} Periods</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#eef5ff]">
                  <span className="text-[#657894]">Primary Section</span>
                  <span className="font-bold">{faculty.currentSection}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#eef5ff]">
                  <span className="text-[#657894]">Work Email</span>
                  <span className="font-mono text-[11px] text-blue-600">{faculty.email}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#eef5ff]">
                  <span className="text-[#657894]">Employee Code</span>
                  <span className="font-mono font-bold">{faculty.employeeCode}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#eef5ff]">
                  <span className="text-[#657894]">Phone</span>
                  <span className="font-mono">{faculty.phone}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#eef5ff]">
                  <span className="text-[#657894]">Cabin</span>
                  <span className="font-bold">{faculty.cabin}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-[#657894]">Joined</span>
                  <span className="font-mono">{faculty.joinedOn}</span>
                </div>
              </div>
            </div>

            {/* Campus presence + attendance this week (faculty_presence, class_sessions) */}
            {(() => {
              const today = getFacultyPresence(faculty.id);
              const mine = sessions.filter((s) => s.facultyId === faculty.id);
              const held = mine.filter((s) => s.status === 'completed' || s.status === 'substituted');
              const present = held.reduce((n, s) => n + (s.studentsPresent ?? 0), 0);
              const strength = held.reduce((n, s) => n + (s.strength ?? 0), 0);
              const ratings = feedback.filter((f) => f.facultyId === faculty.id && f.avgRating !== null);
              return (
                <div className="p-4 rounded-xl border border-[#dce8f7] bg-white">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#657894] mb-3">This week</h4>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-lg bg-[#f0f6ff] p-2.5">
                      <p className="text-[10px] font-semibold text-[#657894]">Today</p>
                      <p className="mt-0.5 text-xs font-bold text-[#10233f]">{today?.status ?? 'No record'}</p>
                      {today?.checkIn && <p className="text-[10px] text-[#657894]">{today.checkIn}–{today.checkOut}</p>}
                    </div>
                    <div className="rounded-lg bg-[#f0f6ff] p-2.5">
                      <p className="text-[10px] font-semibold text-[#657894]">Classes held</p>
                      <p className="mt-0.5 text-xs font-bold text-[#10233f]">{held.length}/{mine.length}</p>
                      <p className="text-[10px] text-[#657894]">{strength ? Math.round((present / strength) * 100) : 0}% attendance</p>
                    </div>
                    <div className="rounded-lg bg-[#f0f6ff] p-2.5">
                      <p className="text-[10px] font-semibold text-[#657894]">Feedback</p>
                      <p className="mt-0.5 text-xs font-bold text-[#10233f]">
                        {ratings.length ? `★ ${(ratings.reduce((n, f) => n + (f.avgRating ?? 0), 0) / ratings.length).toFixed(1)}` : 'Pending'}
                      </p>
                      <p className="text-[10px] text-[#657894]">{ratings.reduce((n, f) => n + f.responses, 0)} responses</p>
                    </div>
                  </div>
                  {mine.filter((s) => s.status === 'cancelled' || s.status === 'substituted').map((s) => (
                    <p key={s.id} className="mt-2 text-[11px] text-[#657894]">
                      <strong className="text-[#10233f]">{s.date}</strong> {s.periodLabel} {s.subject}: {s.remarks}
                    </p>
                  ))}
                  <p className="mt-2 text-[10px] text-[#94a3b8]">Week of {mine[0]?.date ?? clock.dateStr}</p>
                </div>
              );
            })()}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-[#eaf2fc] bg-white flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-[#eef5ff] hover:bg-[#dce8f7] text-xs font-bold text-[#10233f] transition-colors cursor-pointer"
            >
              Close Panel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
