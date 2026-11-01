import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { LeaveType, FacultyMember, SubstitutionSlot } from '../../types';
import {
  CalendarCheck,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  UserCheck,
  Send,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Users,
  CalendarOff,
  Filter,
} from 'lucide-react';

interface FacultyLeaveProps {
  faculty: FacultyMember;
}

const WEEKDAY_NAMES: ('Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday')[] = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export const FacultyLeave: React.FC<FacultyLeaveProps> = ({ faculty }) => {
  const {
    leaveRequests,
    submitLeaveRequest,
    getFreeFacultyForSlot,
    currentTheme,
    clock,
  } = useApp();

  // Tab State: 'roster' | 'apply' | 'my-history'
  const [activeTab, setActiveTab] = useState<'roster' | 'apply' | 'my-history'>('roster');
  const [rosterFilter, setRosterFilter] = useState<string>('all');
  const [expandedRequestId, setExpandedRequestId] = useState<string | null>(null);

  // Form State
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [reason, setReason] = useState('');
  const [leaveType, setLeaveType] = useState<LeaveType>('Casual');
  const [substitutesMap, setSubstitutesMap] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filter this faculty's personal request history
  const historyRequests = leaveRequests.filter((r) => r.facultyId === faculty.id);

  // Filtered requests for the Institutional Roster
  const filteredRoster = leaveRequests.filter((r) => {
    if (rosterFilter === 'all') return true;
    return r.status === rosterFilter;
  });

  const toggleExpand = (id: string) => {
    setExpandedRequestId((prev) => (prev === id ? null : id));
  };

  // Compute number of days
  const daysCount = useMemo(() => {
    if (!fromDate || !toDate) return 0;
    const start = new Date(fromDate);
    const end = new Date(toDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) return 0;
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  }, [fromDate, toDate]);

  // Compute affected class periods when daysCount <= 2
  const affectedClasses = useMemo(() => {
    if (!fromDate || !toDate || daysCount <= 0 || daysCount > 2) return [];

    const start = new Date(fromDate);
    const end = new Date(toDate);
    const slots: {
      date: string;
      dayName: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
      classPeriod: typeof faculty.timetable[0];
      slotKey: string;
    }[] = [];

    const current = new Date(start);
    const pad = (n: number) => n.toString().padStart(2, '0');

    while (current <= end) {
      const dayIndex = current.getDay();
      const dayName = WEEKDAY_NAMES[dayIndex];
      const dateStr = `${current.getFullYear()}-${pad(current.getMonth() + 1)}-${pad(current.getDate())}`;

      // If Sunday, skip
      if (dayName !== 'Sunday') {
        const classesOnDay = faculty.timetable.filter((c) => c.day === dayName);
        classesOnDay.forEach((c) => {
          const slotKey = `${dateStr}_${c.periodNumber}_${c.startTime}`;
          slots.push({
            date: dateStr,
            dayName,
            classPeriod: c,
            slotKey,
          });
        });
      }

      current.setDate(current.getDate() + 1);
    }

    return slots;
  }, [fromDate, toDate, daysCount, faculty.timetable]);

  const handleSubstituteChange = (slotKey: string, substituteId: string) => {
    setSubstitutesMap((prev) => ({
      ...prev,
      [slotKey]: substituteId,
    }));
    setFormError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSuccessMsg(null);

    if (!fromDate || !toDate) {
      setFormError('Please select both From and To dates.');
      return;
    }

    if (new Date(toDate) < new Date(fromDate)) {
      setFormError('End date cannot precede start date.');
      return;
    }

    if (!reason.trim()) {
      setFormError('Please state a valid academic or personal reason for absence.');
      return;
    }

    // If days <= 2, validate all substitution slots are filled
    const generatedSubstitutions: SubstitutionSlot[] = [];
    if (daysCount <= 2 && affectedClasses.length > 0) {
      for (const item of affectedClasses) {
        const chosenSubId = substitutesMap[item.slotKey];
        if (!chosenSubId) {
          setFormError(
            `Please select a substitute faculty colleague for ${item.date} (${item.classPeriod.subject} at ${item.classPeriod.startTime}).`
          );
          return;
        }

        const freeFaculty = getFreeFacultyForSlot(
          item.dayName,
          item.classPeriod.startTime,
          item.classPeriod.endTime,
          item.date,
          faculty.id
        );

        const chosenFac = freeFaculty.find((f) => f.id === chosenSubId);

        generatedSubstitutions.push({
          date: item.date,
          day: item.dayName,
          periodNumber: item.classPeriod.periodNumber,
          startTime: item.classPeriod.startTime,
          endTime: item.classPeriod.endTime,
          subject: item.classPeriod.subject,
          section: item.classPeriod.section,
          semester: item.classPeriod.semester,
          substituteFacultyId: chosenSubId,
          substituteFacultyName: chosenFac?.name || 'Assigned Faculty',
          room: item.classPeriod.room,
          status: 'Pending',
        });
      }
    }

    // Submit Request
    submitLeaveRequest({
      facultyId: faculty.id,
      facultyName: faculty.name,
      department: faculty.department,
      deptShort: faculty.deptShort,
      leaveType,
      fromDate,
      toDate,
      daysCount,
      reason: reason.trim(),
      substitutions: generatedSubstitutions,
    });

    setSuccessMsg('Leave request submitted successfully for administrative audit.');
    setFromDate('');
    setToDate('');
    setReason('');
    setLeaveType('Casual');
    setSubstitutesMap({});
    setActiveTab('my-history');
  };

  return (
    <div className="space-y-4 sm:space-y-5 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#dce8f7]">
        <div>
          <h2 className="text-base sm:text-lg font-extrabold text-[#10233f] tracking-tight">
            Leave & Substitution Portal
          </h2>
          <p className="text-[11px] font-medium text-[#657894] mt-0.5">
            Institutional absence records, approved leave status, and peer class substitution coordination
          </p>
        </div>

        {/* Section Navigation Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-white border border-[#dce8f7] rounded-xl shadow-xs self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('roster')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'roster'
                ? 'text-white shadow-xs'
                : 'text-[#657894] hover:text-[#10233f] hover:bg-[#eef5ff]'
            }`}
            style={{
              background:
                activeTab === 'roster'
                  ? `linear-gradient(135deg, ${currentTheme.primaryHex}, ${currentTheme.deepHex})`
                  : undefined,
            }}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Leave Roster</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                activeTab === 'roster' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
              }`}
            >
              {leaveRequests.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('apply')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'apply'
                ? 'text-white shadow-xs'
                : 'text-[#657894] hover:text-[#10233f] hover:bg-[#eef5ff]'
            }`}
            style={{
              background:
                activeTab === 'apply'
                  ? `linear-gradient(135deg, ${currentTheme.primaryHex}, ${currentTheme.deepHex})`
                  : undefined,
            }}
          >
            <CalendarCheck className="w-3.5 h-3.5" />
            <span>Apply for Leave</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('my-history')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'my-history'
                ? 'text-white shadow-xs'
                : 'text-[#657894] hover:text-[#10233f] hover:bg-[#eef5ff]'
            }`}
            style={{
              background:
                activeTab === 'my-history'
                  ? `linear-gradient(135deg, ${currentTheme.primaryHex}, ${currentTheme.deepHex})`
                  : undefined,
            }}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>My Applications</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                activeTab === 'my-history' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
              }`}
            >
              {historyRequests.length}
            </span>
          </button>
        </div>
      </div>

      {/* ──────────────── TAB 1: INSTITUTIONAL LEAVE ROSTER & REAL DATA ──────────────── */}
      {activeTab === 'roster' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          {/* Filter Sub-header */}
          <div className="bg-white rounded-2xl border border-[#dce8f7] p-3.5 sm:p-4 shadow-[0_6px_20px_rgba(31,76,126,0.05)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-[#10233f]">
                Faculty Absence & Substitute Coverage Roster
              </h3>
              <p className="text-[11px] text-[#657894] mt-0.5">
                Live institutional status for all approved leaves, pending applications, and class substitutions
              </p>
            </div>

            <div className="flex w-full min-w-0 max-w-full items-center gap-1.5 overflow-x-auto">
              {[
                { id: 'all', label: 'All Requests' },
                { id: 'Approved', label: 'Approved' },
                { id: 'Pending', label: 'Pending' },
                { id: 'Rejected', label: 'Rejected' },
              ].map((tab) => {
                const isActive = rosterFilter === tab.id;
                const count =
                  tab.id === 'all'
                    ? leaveRequests.length
                    : leaveRequests.filter((l) => l.status === tab.id).length;

                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setRosterFilter(tab.id)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      isActive
                        ? 'text-white shadow-xs'
                        : 'bg-[#eef5ff] text-[#657894] hover:text-[#10233f] hover:bg-[#e2ecf9]'
                    }`}
                    style={{
                      background: isActive
                        ? `linear-gradient(135deg, ${currentTheme.primaryHex}, ${currentTheme.deepHex})`
                        : undefined,
                    }}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono ${
                        isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* List of Leave Rows / Cards */}
          <div className="space-y-3">
            {filteredRoster.length === 0 ? (
              <div className="bg-white rounded-2xl border border-[#dce8f7] p-8 text-center text-xs text-[#657894]">
                No records matching this status filter.
              </div>
            ) : (
              filteredRoster.map((req) => {
                const isPending = req.status === 'Pending';
                const isApproved = req.status === 'Approved';
                const isRejected = req.status === 'Rejected';
                const isExpanded = expandedRequestId === req.id;
                const isMe = req.facultyId === faculty.id;

                return (
                  <div
                    key={req.id}
                    className="bg-white rounded-2xl border border-[#dce8f7] p-4 sm:p-4.5 shadow-[0_6px_20px_rgba(31,76,126,0.05)] card-lift transition-all"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                      {/* Left Info */}
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-[#10233f]">
                            {req.facultyName} {isMe && <span className="text-[10px] text-blue-600 font-semibold">(You)</span>}
                          </span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[#eff6ff] text-blue-700">
                            {req.department}
                          </span>
                          <span className="text-[10px] font-bold text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded-md">
                            {req.daysCount} Day{req.daysCount > 1 ? 's' : ''} Leave
                          </span>

                          {/* Status Chip Requirement 1: On Leave / Pending / Rejected */}
                          {isApproved && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100/80 text-amber-900 border border-amber-300">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                              {clock.dateStr >= req.fromDate && clock.dateStr <= req.toDate ? 'On Leave' : 'Approved'}
                            </span>
                          )}
                          {isPending && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-900 border border-amber-300">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                              Pending
                            </span>
                          )}
                          {isRejected && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-50 text-red-800 border border-red-200">
                              Rejected
                            </span>
                          )}
                        </div>

                        {/* Dates & Reason */}
                        <div className="text-[11px] text-[#657894] font-medium flex items-center gap-2 flex-wrap">
                          <span>
                            Absence Period:{' '}
                            <strong className="text-[#10233f] font-mono">
                              {req.fromDate}
                            </strong>{' '}
                            →{' '}
                            <strong className="text-[#10233f] font-mono">
                              {req.toDate}
                            </strong>
                          </span>
                          <span>·</span>
                          {req.leaveType && (
                            <>
                              <span className="rounded-md bg-[#eaf2fc] px-1.5 py-0.5 font-bold text-[#334155]">{req.leaveType} leave</span>
                              <span>·</span>
                            </>
                          )}
                          <span>Requested on {req.createdAt}</span>
                        </div>

                        <p className="text-[11px] text-[#10233f] bg-[#f8fbff] p-2.5 rounded-xl border border-[#e2ecf9] italic leading-relaxed">
                          &ldquo;{req.reason}&rdquo;
                        </p>

                        {/* Substitution summary badge */}
                        {req.substitutions.length > 0 ? (
                          <div className="flex items-center gap-2 pt-0.5">
                            <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
                              <UserCheck className="w-3 h-3" />
                              {req.substitutions.length} peer substitute slot(s) mapped
                            </span>
                            <button
                              type="button"
                              onClick={() => toggleExpand(req.id)}
                              className="text-[11px] font-bold text-blue-600 hover:text-blue-800 inline-flex items-center gap-0.5 cursor-pointer ml-1"
                            >
                              <span>{isExpanded ? 'Hide details' : 'View substitute plan'}</span>
                              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </button>
                          </div>
                        ) : req.daysCount > 2 ? (
                          <div className="text-[11px] text-[#657894] flex items-center gap-1.5 pt-0.5">
                            <AlertTriangle className="w-3 h-3 text-amber-500" />
                            <span>Extended Leave: Substitution coordinated centrally by Academic Administration.</span>
                          </div>
                        ) : (
                          <div className="text-[11px] text-[#657894] pt-0.5">
                            No regular classes fall on this date.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Collapsible substitution schedule */}
                    {isExpanded && req.substitutions.length > 0 && (
                      <div className="mt-3.5 pt-3.5 border-t border-[#eaf2fc] animate-in fade-in duration-150">
                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#657894] mb-2">
                          Assigned Peer Class Substitutions
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {req.substitutions.map((sub, idx) => (
                            <div
                              key={idx}
                              className="p-2.5 rounded-xl border border-[#dce8f7] bg-[#f8fbff] text-xs flex items-center justify-between gap-2"
                            >
                              <div>
                                <div className="font-bold text-[#10233f]">
                                  {sub.subject} ({sub.section} Sec)
                                </div>
                                <div className="text-[10px] text-[#657894] font-mono">
                                  {sub.date} · Period {sub.periodNumber} ({sub.startTime}–{sub.endTime})
                                </div>
                              </div>
                              <div className="text-right">
                                <span className="text-[9px] font-bold uppercase tracking-wider text-[#657894] block">
                                  Substitute
                                </span>
                                <span className="font-bold text-blue-700 text-xs">
                                  {sub.substituteFacultyName}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ──────────────── TAB 2: APPLY FOR LEAVE ──────────────── */}
      {activeTab === 'apply' && (
        <div className="bg-white rounded-2xl border border-[#dce8f7] p-4.5 sm:p-5 shadow-[0_8px_24px_rgba(31,76,126,0.06)] animate-in fade-in duration-150">
          <h3 className="text-xs sm:text-sm font-bold text-[#10233f] mb-3 pb-2.5 border-b border-[#eaf2fc] flex items-center gap-2">
            <CalendarCheck className="w-4 h-4 text-blue-600" />
            <span>Apply for New Leave & Arrange Peer Substitution</span>
          </h3>

          {/* Feedback alerts */}
          {formError && (
            <div className="mb-4 p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{formError}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Date Picker Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#657894] mb-1">
                  From Date
                </label>
                <input
                  type="date"
                  required
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-full px-3 py-2 bg-[#f8fbff] text-xs font-medium border border-[#dce8f7] rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#657894] mb-1">
                  To Date
                </label>
                <input
                  type="date"
                  required
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-full px-3 py-2 bg-[#f8fbff] text-xs font-medium border border-[#dce8f7] rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                />
              </div>

              <div className="sm:col-span-2 lg:col-span-1 flex flex-col justify-end">
                <div className="p-2 rounded-xl bg-[#eef5ff] border border-[#dce8f7] text-xs text-[#10233f] flex items-center justify-between">
                  <span className="font-bold text-[#657894] text-[11px]">Calculated Duration:</span>
                  <span className="font-extrabold text-blue-700 text-xs">
                    {daysCount > 0 ? `${daysCount} Day${daysCount > 1 ? 's' : ''}` : 'Select dates'}
                  </span>
                </div>
              </div>
            </div>

            {/* Leave type (leave_requests.leave_type) */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#657894] mb-1">
                Leave Type
              </label>
              <div className="grid grid-cols-2 gap-1 rounded-xl border border-[#dce8f7] bg-[#f0f6ff] p-1 sm:grid-cols-4">
                {(['Casual', 'Medical', 'Duty', 'Earned'] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setLeaveType(type)}
                    className={`rounded-lg py-2 text-xs font-bold transition ${leaveType === type ? 'bg-[#10233f] text-white' : 'text-[#657894] hover:text-[#10233f]'}`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Reason Field */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#657894] mb-1">
                Reason for Leave Application
              </label>
              <textarea
                rows={2}
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="State academic reason (e.g. Attending IEEE Conference, External Viva Examiner, Medical)"
                className="w-full px-3 py-2 bg-[#f8fbff] text-xs font-medium border border-[#dce8f7] rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:border-transparent transition-all placeholder:text-[#94a3b8]"
              />
            </div>

            {/* Period Substitution Section (only for short leave <= 2 days) */}
            {daysCount > 0 && daysCount <= 2 && (
              <div className="p-4 rounded-xl border border-blue-200 bg-[#f8fbff] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#10233f] flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                    <span>Peer Class Substitution Assignment</span>
                  </span>
                  <span className="text-[10px] font-medium text-[#657894]">
                    {affectedClasses.length} period(s) need peer coverage
                  </span>
                </div>

                {affectedClasses.length === 0 ? (
                  <p className="text-xs text-emerald-700">
                    No teaching periods scheduled on selected dates.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {affectedClasses.map((item) => {
                      const freeFaculty = getFreeFacultyForSlot(
                        item.dayName,
                        item.classPeriod.startTime,
                        item.classPeriod.endTime,
                        item.date,
                        faculty.id
                      );

                      const selectedSub = substitutesMap[item.slotKey] || '';

                      return (
                        <div
                          key={item.slotKey}
                          className="p-3 bg-white rounded-xl border border-[#dce8f7] flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-50 text-blue-700">
                                {item.classPeriod.subjectCode}
                              </span>
                              <span className="font-bold text-[#10233f]">
                                {item.classPeriod.subject}
                              </span>
                            </div>
                            <div className="text-[10px] text-[#657894] flex items-center gap-2">
                              <span>{item.date} ({item.dayName})</span>
                              <span>·</span>
                              <span>Period {item.classPeriod.periodNumber} ({item.classPeriod.startTime}–{item.classPeriod.endTime})</span>
                              <span>·</span>
                              <span>Sem {item.classPeriod.semester} {item.classPeriod.section}</span>
                            </div>
                          </div>

                          <div className="w-full md:w-64">
                            <label className="block text-[9px] font-bold uppercase tracking-wider text-[#657894] mb-1">
                              Select Free Substitute:
                            </label>
                            <select
                              value={selectedSub}
                              onChange={(e) => handleSubstituteChange(item.slotKey, e.target.value)}
                              className={`w-full px-2.5 py-1.5 text-xs font-semibold rounded-lg border focus:outline-none ${
                                selectedSub
                                  ? 'border-emerald-300 bg-emerald-50/50 text-emerald-900'
                                  : 'border-amber-300 bg-amber-50/50 text-amber-900'
                              }`}
                            >
                              <option value="">-- Choose Colleague --</option>
                              {freeFaculty.map((f) => (
                                <option key={f.id} value={f.id}>
                                  {f.name} ({f.deptShort})
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Notice when days > 2 */}
            {daysCount > 2 && (
              <div className="p-3 rounded-xl border border-amber-200 bg-amber-50/50 text-xs text-amber-900 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Extended Leave ({daysCount} days):</strong> Substitution scheduling is managed centrally by Academic Administration. Request will be forwarded directly to Dean Shivani Singh.
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl font-bold text-xs text-white shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              style={{
                background: `linear-gradient(135deg, ${currentTheme.primaryHex}, ${currentTheme.deepHex})`,
              }}
            >
              <Send className="w-3.5 h-3.5" />
              <span>Submit Leave Request</span>
            </button>
          </form>
        </div>
      )}

      {/* ──────────────── TAB 3: MY SUBMITTED APPLICATIONS ──────────────── */}
      {activeTab === 'my-history' && (
        <div className="bg-white rounded-2xl border border-[#dce8f7] p-4.5 sm:p-5 shadow-[0_8px_24px_rgba(31,76,126,0.06)] animate-in fade-in duration-150">
          <div className="flex items-center justify-between mb-3.5 pb-2.5 border-b border-[#eaf2fc]">
            <h3 className="text-xs sm:text-sm font-bold text-[#10233f]">
              Your Personal Leave Applications
            </h3>
            <button
              type="button"
              onClick={() => setActiveTab('apply')}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
            >
              + New Application
            </button>
          </div>

          {historyRequests.length === 0 ? (
            <div className="text-center py-8 text-xs text-[#657894]">
              You have not submitted any personal leave applications yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#eaf2fc] text-[#657894] text-[10px] uppercase font-bold tracking-wider">
                    <th className="py-2 px-3">From</th>
                    <th className="py-2 px-3">To</th>
                    <th className="py-2 px-3">Duration</th>
                    <th className="py-2 px-3">Reason</th>
                    <th className="py-2 px-3">Substitutions</th>
                    <th className="py-2 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eef5ff]">
                  {historyRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-[#f8fbff] transition-colors">
                      <td className="py-2.5 px-3 font-mono text-[#10233f] font-semibold">
                        {req.fromDate}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[#10233f] font-semibold">
                        {req.toDate}
                      </td>
                      <td className="py-2.5 px-3 text-[#657894]">
                        {req.daysCount} Day{req.daysCount > 1 ? 's' : ''}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-[#10233f] max-w-xs truncate">
                        {req.reason}
                      </td>
                      <td className="py-2.5 px-3 text-[#657894]">
                        {req.substitutions.length > 0 ? (
                          <span className="text-[11px] font-semibold text-emerald-700">
                            {req.substitutions.length} slot(s) mapped
                          </span>
                        ) : (
                          <span className="text-[11px] text-[#8494aa]">Central/None</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        {req.status === 'Approved' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100/80 text-amber-900 border border-amber-300">
                            {clock.dateStr >= req.fromDate && clock.dateStr <= req.toDate ? 'On Leave' : 'Approved'}
                          </span>
                        )}
                        {req.status === 'Pending' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-300">
                            Pending
                          </span>
                        )}
                        {req.status === 'Rejected' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-800 border border-red-200">
                            Rejected
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
