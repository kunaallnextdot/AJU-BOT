import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { FacultyMember } from '../../types';
import {
  Layers,
  CheckCircle,
  Circle,
  Plus,
  BookOpen,
  ChevronDown,
  ChevronUp,
  GraduationCap,
  Sparkles,
} from 'lucide-react';

interface FacultyDashboardProps {
  faculty: FacultyMember;
}

export const FacultyDashboard: React.FC<FacultyDashboardProps> = ({ faculty }) => {
  const {
    facultyList,
    toggleModuleCompletion,
    addSubjectModule,
    currentTheme,
    clock,
    feedback,
  } = useApp();

  // Retrieve live faculty to maintain immediate sync
  const currentFaculty = facultyList.find((f) => f.id === faculty.id) || faculty;

  const [expandedSubjectId, setExpandedSubjectId] = useState<string | null>(
    currentFaculty.subjects[0]?.id || null
  );
  const [newModuleInputs, setNewModuleInputs] = useState<Record<string, string>>({});

  const toggleAccordion = (subjectId: string) => {
    setExpandedSubjectId((prev) => (prev === subjectId ? null : subjectId));
  };

  const handleAddModule = (subjectId: string) => {
    const text = newModuleInputs[subjectId]?.trim();
    if (!text) return;
    addSubjectModule(currentFaculty.id, subjectId, text);
    setNewModuleInputs((prev) => ({ ...prev, [subjectId]: '' }));
  };

  // Compute stat card numbers from live faculty
  const distinctSemesters = Array.from(
    new Set(currentFaculty.subjects.map((s) => s.semester))
  ).length;

  const distinctSections = Array.from(
    new Set(currentFaculty.subjects.map((s) => s.section))
  ).length;

  const allModules = currentFaculty.subjects.flatMap((s) => s.modules);
  const completedModules = allModules.filter((m) => m.completed).length;
  const overallSyllabusPercent = allModules.length
    ? Math.round((completedModules / allModules.length) * 100)
    : 0;

  const todayClassesCount = currentFaculty.timetable.filter(
    (c) => c.day === clock.dayName
  ).length;

  return (
    <div className="space-y-4 sm:space-y-5 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="relative overflow-hidden rounded-[26px] border border-[#e5e5e2] bg-[linear-gradient(135deg,#f7f7f5_0%,#f9fbff_56%,#eef6f0_100%)] p-5 sm:p-7">
        <div className="absolute -right-14 -top-16 h-48 w-48 rounded-full bg-[#dcdcd8]/35 blur-2xl" />
        <div className="relative z-10 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/70 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-[#1f9d55] shadow-sm backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" /> Faculty workspace
            </div>
            <h2 className="text-2xl font-extrabold tracking-[-0.045em] text-[#171717] sm:text-3xl">
              Your teaching cockpit.
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-[#737373]">
              Keep syllabus progress visible, make updates quickly, and stay ahead of the next academic milestone.
            </p>
          </div>
          <div className="rounded-2xl border border-white/90 bg-white/75 px-4 py-3 shadow-sm backdrop-blur">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#a3a3a3]">Today&apos;s focus</p>
            <p className="mt-1 text-sm font-extrabold text-[#171717]">{clock.dayName} · {todayClassesCount} classes</p>
          </div>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Stat 1: Total Semesters */}
        <div className="bg-white rounded-2xl border border-[#e7e7e4] p-4.5 sm:p-5 shadow-[0_8px_24px_rgba(0,0,0,0.06)] card-lift">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#737373] block mb-1.5">
            Total Semesters
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-[#171717] font-mono tabular-nums">
              {distinctSemesters}
            </span>
            <span className="text-[11px] text-[#737373]">Active cohorts</span>
          </div>
        </div>

        {/* Stat 2: Total Sections */}
        <div className="bg-white rounded-2xl border border-[#e7e7e4] p-4.5 sm:p-5 shadow-[0_8px_24px_rgba(0,0,0,0.06)] card-lift">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#737373] block mb-1.5">
            Total Sections
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-[#171717] font-mono tabular-nums">
              {distinctSections}
            </span>
            <span className="text-[11px] text-[#737373]">Batches allocated</span>
          </div>
        </div>

        {/* Stat 3: Syllabus Status */}
        <div className="bg-white rounded-2xl border border-[#e7e7e4] p-4.5 sm:p-5 shadow-[0_8px_24px_rgba(0,0,0,0.06)] card-lift">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#737373] block mb-1.5">
            Syllabus Status
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-green-600 font-mono tabular-nums">
              {overallSyllabusPercent}%
            </span>
            <span className="text-[11px] text-[#737373]">
              {completedModules}/{allModules.length} done
            </span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-2.5">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${overallSyllabusPercent}%`,
                backgroundColor: currentTheme.primaryHex,
              }}
            />
          </div>
        </div>

        {/* Stat 4: Today's Classes */}
        <div className="bg-white rounded-2xl border border-[#e7e7e4] p-4.5 sm:p-5 shadow-[0_8px_24px_rgba(0,0,0,0.06)] card-lift">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#737373] block mb-1.5">
            Today&apos;s Classes
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-emerald-600 font-mono tabular-nums">
              {todayClassesCount}
            </span>
            <span className="text-[11px] text-[#737373]">Periods on {clock.dayName}</span>
          </div>
        </div>
      </div>

      {/* Subjects Grouped by Semester -> Section with Accordion Module Checklist */}
      <div className="bg-white rounded-2xl border border-[#e7e7e4] p-4.5 sm:p-5 shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
        <div className="flex items-center justify-between mb-3.5 pb-2.5 border-b border-[#efefed]">
          <div>
            <h3 className="text-[13px] font-bold text-[#171717]">
              Allocated Subjects & Syllabus Modules
            </h3>
            <p className="text-[11px] text-[#737373] mt-0.5">
              Click a course row to expand unit checklists. Ticking a module updates completion across the platform in real time.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {currentFaculty.subjects.map((subject) => {
            const isExpanded = expandedSubjectId === subject.id;
            const completedCount = subject.modules.filter((m) => m.completed).length;
            // Same rule as v_syllabus_completion: average of unit completion %
            const percent = subject.modules.length
              ? Math.round(subject.modules.reduce((n, m) => n + (m.completionPct ?? (m.completed ? 100 : 0)), 0) / subject.modules.length)
              : 0;
            const courseFeedback = feedback.find((f) => f.facultyId === currentFaculty.id && f.courseCode === subject.code);
            // HARD CAP OF 5: Only allow adding while fewer than 5 modules exist
            const canAddModule = subject.modules.length < 5;

            return (
              <div
                key={subject.id}
                className="rounded-2xl border border-[#e7e7e4] bg-white overflow-hidden shadow-xs transition-all"
              >
                {/* Accordion Row Header */}
                <div
                  onClick={() => toggleAccordion(subject.id)}
                  className="p-4 sm:p-5 hover:bg-[#fafaf9] transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer select-none"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-[#eef6f0] text-green-700">
                        {subject.section}
                      </span>
                      <span className="text-xs font-mono font-bold text-[#737373]">
                        {subject.code}
                      </span>
                      {subject.category && (
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-[#efefed] text-[#404040]">
                          {subject.category}{subject.credits ? ` · ${subject.credits} credits` : ''}
                        </span>
                      )}
                      {courseFeedback && (
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${courseFeedback.status === 'Done' ? 'bg-[#e7f6ec] text-[#17803f]' : 'bg-[#fff6df] text-[#a66c00]'}`}>
                          Feedback {courseFeedback.status === 'Done' ? `★ ${courseFeedback.avgRating?.toFixed(1)} · ${courseFeedback.responses} responses` : 'pending'}
                        </span>
                      )}
                      {subject.modules.length >= 5 && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                          Full 5 Modules Cap Reached
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm sm:text-base font-extrabold text-[#171717]">
                      {subject.name}
                    </h4>

                    {/* Progress bar */}
                    <div className="mt-2.5 flex items-center gap-3 max-w-md">
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${percent}%`,
                            backgroundColor: currentTheme.primaryHex,
                          }}
                        />
                      </div>
                      <span className="text-xs font-mono font-bold text-[#171717]">
                        {completedCount}/{subject.modules.length} units · {percent}%
                      </span>
                    </div>
                  </div>

                  {/* Toggle Indicator */}
                  <div className="flex items-center gap-2 self-start md:self-center">
                    <span className="text-xs font-bold text-green-600">
                      {isExpanded ? 'Hide Modules' : 'Manage Modules'}
                    </span>
                    <div className="p-1 rounded-lg text-[#737373]">
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Accordion: Module Checklist & Add Module form */}
                {isExpanded && (
                  <div className="p-4 sm:p-5 border-t border-[#efefed] bg-[#fafaf9] space-y-3.5 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#737373]">
                        Course Units & Syllabus Completion Checklist ({subject.modules.length}/5)
                      </span>
                      <span className="text-[11px] text-[#737373]">
                        Click checkbox to toggle completion
                      </span>
                    </div>

                    {/* Module Checkable Rows (Only faculty can click) */}
                    <div className="space-y-2">
                      {subject.modules.map((mod) => (
                        <div
                          key={mod.id}
                          onClick={() =>
                            toggleModuleCompletion(currentFaculty.id, subject.id, mod.id)
                          }
                          className={`p-3 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                            mod.completed
                              ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                              : 'bg-white border-[#e7e7e4] text-[#171717] hover:border-green-300'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {mod.completed ? (
                              <CheckCircle className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
                            ) : (
                              <Circle className="w-4.5 h-4.5 text-slate-300 shrink-0 hover:text-green-500 transition-colors" />
                            )}
                            <div className="min-w-0">
                              <span
                                className={`text-xs font-medium ${
                                  mod.completed ? 'line-through text-emerald-800' : ''
                                }`}
                              >
                                {mod.name}
                              </span>
                              {mod.topics && <p className="mt-0.5 truncate text-[11px] text-[#737373]">{mod.topics}{mod.plannedHours ? ` · ${mod.plannedHours} hrs planned` : ''}</p>}
                              {mod.status === 'in_progress' && (
                                <div className="mt-1.5 h-1.5 w-40 overflow-hidden rounded-full bg-[#efefed]">
                                  <div className="h-full rounded-full bg-[#d08a1e]" style={{ width: `${mod.completionPct ?? 0}%` }} />
                                </div>
                              )}
                            </div>
                          </div>

                          <span
                            className={`text-[9px] font-bold px-2 py-0.5 rounded font-mono shrink-0 ${
                              mod.completed
                                ? 'bg-emerald-100 text-emerald-800'
                                : mod.status === 'in_progress'
                                ? 'bg-[#fff6df] text-[#a66c00]'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {mod.completed ? 'COMPLETED' : mod.status === 'in_progress' ? `IN PROGRESS ${mod.completionPct}%` : 'NOT STARTED'}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* "Add module" control at bottom: ONLY visible/enabled while fewer than 5 modules exist */}
                    {canAddModule && (
                      <div className="pt-2">
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-[#737373] mb-1.5">
                          Append Course Syllabus Module ({subject.modules.length}/5 modules defined)
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newModuleInputs[subject.id] || ''}
                            onChange={(e) =>
                              setNewModuleInputs((prev) => ({
                                ...prev,
                                [subject.id]: e.target.value,
                              }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddModule(subject.id);
                              }
                            }}
                            placeholder="Add module name… (e.g. Module 5: Advanced Optimization & Graphs)"
                            className="flex-1 px-3.5 py-2 bg-white text-xs font-medium border border-[#e7e7e4] rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all placeholder:text-[#a3a3a3]"
                          />
                          <button
                            type="button"
                            onClick={() => handleAddModule(subject.id)}
                            className="px-4 py-2 rounded-xl font-extrabold text-xs text-white shadow-sm hover:shadow-md transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                            style={{
                              background: `linear-gradient(135deg, ${currentTheme.primaryHex}, ${currentTheme.deepHex})`,
                            }}
                          >
                            <Plus className="w-4 h-4" />
                            <span>Add</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
