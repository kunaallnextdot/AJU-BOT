import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../../context/AppContext';
import { AdminUser, FacultyMember } from '../../types';
import { parseLocalDate } from '../../lib/leaveRules';
import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  Building2,
  CalendarCheck,
  CalendarDays,
  Check,
  Clock,
  Copy,
  DoorOpen,
  Hash,
  Mail,
  Phone,
  Send,
  Users,
  X,
} from 'lucide-react';

interface ProfileModalProps {
  onClose: () => void;
  onNavigate?: (tab: string) => void;
}

const formatDate = (s?: string | null) =>
  s ? parseLocalDate(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : null;

/** One labelled detail; `href` makes it a link (mailto:, tel:) and `copy` adds a copy button. */
const DetailRow: React.FC<{
  icon: React.ElementType;
  label: string;
  value?: string | null;
  href?: string;
  copy?: boolean;
}> = ({ icon: Icon, label, value, href, copy }) => {
  const [copied, setCopied] = useState(false);
  const shown = value || 'Not added';

  const copyValue = async () => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard can be blocked (http, permissions); the value is still selectable
    }
  };

  return (
    <div className="flex items-center gap-3 rounded-xl border border-[#eaf2fc] bg-[#f8fbff] px-3 py-2.5">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-blue-600 shadow-xs">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-wider text-[#657894]">{label}</p>
        {href && value ? (
          <a href={href} className="block truncate text-xs font-semibold text-blue-700 hover:underline select-text">
            {shown}
          </a>
        ) : (
          <p className={`truncate text-xs font-semibold select-text ${value ? 'text-[#10233f]' : 'text-[#94a3b8] italic'}`}>{shown}</p>
        )}
      </div>
      {copy && value && (
        <button
          type="button"
          onClick={copyValue}
          className="shrink-0 rounded-lg p-1.5 text-[#657894] hover:bg-white hover:text-blue-700"
          aria-label={`Copy ${label.toLowerCase()}`}
          title={copied ? 'Copied' : `Copy ${label.toLowerCase()}`}
        >
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
      )}
    </div>
  );
};

/** A shortcut card that jumps to another workspace page. */
const LinkCard: React.FC<{ icon: React.ElementType; label: string; value: string; sub: string; onClick?: () => void }> = ({
  icon: Icon,
  label,
  value,
  sub,
  onClick,
}) => (
  <button
    type="button"
    onClick={onClick}
    className="card-lift flex w-full min-w-0 items-center gap-3 rounded-xl border border-[#dce8f7] bg-white px-3 py-3 text-left shadow-xs hover:border-blue-300"
  >
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--accent-light)] text-blue-600">
      <Icon className="h-4 w-4" />
    </span>
    <span className="min-w-0 flex-1">
      <span className="block text-[10px] font-bold uppercase tracking-wider text-[#657894]">{label}</span>
      <span className="block truncate text-sm font-extrabold text-[#10233f]">{value}</span>
      <span className="block truncate text-[11px] text-[#657894]">{sub}</span>
    </span>
    <ArrowRight className="h-3.5 w-3.5 shrink-0 text-blue-600" />
  </button>
);

export const ProfileModal: React.FC<ProfileModalProps> = ({ onClose, onNavigate }) => {
  const { currentUser, facultyList, leaveRequests, leaveApproverFor, currentTheme } = useApp();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!currentUser) return null;
  const isAdmin = currentUser.role === 'admin';
  // Read the live record so edits (e.g. ticked syllabus units) show immediately
  const faculty = isAdmin ? null : facultyList.find((f) => f.id === currentUser.id) ?? (currentUser as FacultyMember);
  const admin = isAdmin ? (currentUser as AdminUser) : null;

  const go = (tab: string) => {
    onClose();
    onNavigate?.(tab);
  };

  const myLeaves = faculty ? leaveRequests.filter((l) => l.facultyId === faculty.id) : [];
  const pendingMine = myLeaves.filter((l) => l.status === 'Pending').length;
  const approvedMine = myLeaves.filter((l) => l.status === 'Approved').length;
  const approver = faculty ? leaveApproverFor(faculty.deptShort) : null;
  const modules = faculty?.subjects.flatMap((s) => s.modules) ?? [];
  const modulesDone = modules.filter((m) => m.completed).length;
  const teachingDays = faculty ? new Set(faculty.timetable.map((c) => c.day)).size : 0;
  const pendingForAdmin = leaveRequests.filter((l) => l.status === 'Pending').length;

  // Portal to <body>: rendered from the sticky header, it would otherwise sit under the sidebar
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label="My profile">
      <div className="absolute inset-0 bg-[#10233f]/40 backdrop-blur-xs" onClick={onClose} />
      <div className="relative flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl border border-[#dce8f7] bg-[#f4f8fe] shadow-[0_16px_36px_rgba(31,76,126,0.18)] animate-in fade-in duration-200 sm:rounded-2xl">
        {/* Header */}
        <div
          className="relative px-5 pb-5 pt-5 text-white"
          style={{ background: `linear-gradient(135deg, ${currentTheme.primaryHex}, ${currentTheme.deepHex})` }}
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 rounded-lg p-1.5 text-white/80 hover:bg-white/15 hover:text-white"
            aria-label="Close profile"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-3.5 pr-8">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20 text-lg font-extrabold ring-2 ring-white/40">
              {currentUser.avatarInitials}
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-lg font-extrabold tracking-tight">{currentUser.name}</h2>
              <p className="truncate text-xs font-medium text-blue-100">
                {faculty ? `${faculty.designation || faculty.position} · ${faculty.department}` : admin?.position}
              </p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold">{isAdmin ? 'Admin' : 'Faculty'}</span>
                {faculty && <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold">{faculty.deptShort}</span>}
                {faculty?.employeeCode && <span className="rounded-full bg-white/20 px-2 py-0.5 font-mono text-[10px] font-bold">{faculty.employeeCode}</span>}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-5 overflow-y-auto p-4 sm:p-5">
          {/* Contact & office details */}
          <section>
            <h3 className="mb-2 text-[11px] font-bold uppercase tracking-wider text-[#657894]">Contact & details</h3>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <DetailRow icon={Mail} label="Email" value={currentUser.email} href={`mailto:${currentUser.email}`} copy />
              {faculty && (
                <>
                  <DetailRow icon={Phone} label="Phone" value={faculty.phone} href={faculty.phone ? `tel:${faculty.phone.replace(/[^\d+]/g, '')}` : undefined} copy />
                  <DetailRow icon={BadgeCheck} label="Designation" value={faculty.designation || faculty.position} />
                  <DetailRow icon={Building2} label="Department" value={`${faculty.department} (${faculty.deptShort})`} />
                  <DetailRow icon={Hash} label="Employee code" value={faculty.employeeCode} copy />
                  <DetailRow icon={DoorOpen} label="Cabin" value={faculty.cabin} />
                  <DetailRow icon={CalendarDays} label="Joined on" value={formatDate(faculty.joinedOn)} />
                  <DetailRow icon={Users} label="Current section" value={faculty.currentSection} />
                  <DetailRow
                    icon={Send}
                    label="Leave requests go to"
                    value={approver ? `${approver.name} · ${approver.position}` : 'No reviewing admin configured'}
                    href={approver ? `mailto:${approver.email}` : undefined}
                  />
                </>
              )}
              {admin && (
                <>
                  <DetailRow icon={BadgeCheck} label="Position" value={admin.position} />
                  <DetailRow icon={Building2} label="Reviews leave for" value={admin.departments?.length ? admin.departments.join(', ') : 'All departments'} />
                </>
              )}
            </div>
          </section>

          {/* Shortcuts into the workspace */}
          <section>
            <h3 className="mb-2 text-[11px] font-bold uppercase tracking-wider text-[#657894]">{faculty ? 'My work' : 'Workspace'}</h3>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {faculty ? (
                <>
                  <LinkCard icon={Clock} label="Timetable" value={`${faculty.timetable.length} periods / week`} sub={`${teachingDays} teaching day${teachingDays === 1 ? '' : 's'}`} onClick={() => go('timetable')} />
                  <LinkCard icon={BookOpen} label="Syllabus" value={`${modulesDone}/${modules.length} units`} sub={`${faculty.subjects.length} subject${faculty.subjects.length === 1 ? '' : 's'}`} onClick={() => go('dashboard')} />
                  <LinkCard icon={CalendarCheck} label="My leave" value={`${pendingMine} pending`} sub={`${approvedMine} approved · ${myLeaves.length} total`} onClick={() => go('leave')} />
                </>
              ) : (
                <>
                  <LinkCard icon={CalendarCheck} label="Leave queue" value={`${pendingForAdmin} pending`} sub="Requests sent to you" onClick={() => go('leave')} />
                  <LinkCard icon={Users} label="Faculty" value={`${facultyList.length} members`} sub="Open the directory" onClick={() => go('faculty')} />
                  <LinkCard icon={CalendarDays} label="Calendar" value="Holidays" sub="Academic calendar" onClick={() => go('calendar')} />
                </>
              )}
            </div>
          </section>

          {/* Subjects taught */}
          {faculty && (
            <section>
              <h3 className="mb-2 text-[11px] font-bold uppercase tracking-wider text-[#657894]">Subjects I teach</h3>
              {faculty.subjects.length === 0 ? (
                <p className="rounded-xl border border-dashed border-[#dce8f7] bg-white px-3 py-4 text-center text-xs text-[#657894]">
                  No subjects assigned yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {faculty.subjects.map((subject) => {
                    const done = subject.modules.filter((m) => m.completed).length;
                    const pct = subject.modules.length ? Math.round((done / subject.modules.length) * 100) : 0;
                    return (
                      <button
                        key={subject.id}
                        type="button"
                        onClick={() => go('dashboard')}
                        className="flex w-full min-w-0 items-center gap-3 rounded-xl border border-[#dce8f7] bg-white px-3 py-2.5 text-left hover:border-blue-300"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-bold text-[#10233f]">{subject.name}</p>
                          <p className="truncate text-[11px] text-[#657894]">
                            <span className="font-mono">{subject.code}</span> · Sem {subject.semester} · {subject.section}
                            {subject.category ? ` · ${subject.category}` : ''}
                            {subject.credits ? ` · ${subject.credits} credits` : ''}
                          </p>
                          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[#eaf2fc]">
                            <div className="h-full rounded-full bg-blue-600" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                        <span className="shrink-0 text-[11px] font-bold text-[#10233f]">{done}/{subject.modules.length}</span>
                        <ArrowRight className="h-3.5 w-3.5 shrink-0 text-blue-600" />
                      </button>
                    );
                  })}
                </div>
              )}
            </section>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
