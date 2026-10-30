import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  CalendarCheck,
  CheckCircle2,
  XCircle,
  Clock,
  UserCheck,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Filter,
} from 'lucide-react';

export const AdminLeave: React.FC = () => {
  const { leaveRequests, updateLeaveRequestStatus, currentTheme, clock, sessions } = useApp();
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [expandedRequestId, setExpandedRequestId] = useState<string | null>(null);

  const filteredRequests = leaveRequests.filter((r) => {
    if (filterStatus === 'all') return true;
    return r.status === filterStatus;
  });

  const toggleExpand = (id: string) => {
    setExpandedRequestId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Controls & Status Tabs */}
      <div className="bg-white rounded-2xl border border-[#e7e7e4] p-4.5 sm:p-5 shadow-[0_8px_24px_rgba(0,0,0,0.06)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5">
        <div>
          <h2 className="text-sm font-bold text-[#171717]">
            Faculty Leave & Class Substitution Requests
          </h2>
          <p className="text-[11px] text-[#737373] mt-0.5">
            Audit and approve faculty absence requests and period substitutions
          </p>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto">
          {[
            { id: 'all', label: 'All Requests' },
            { id: 'Pending', label: 'Pending' },
            { id: 'Approved', label: 'Approved' },
            { id: 'Rejected', label: 'Rejected' },
          ].map((tab) => {
            const isActive = filterStatus === tab.id;
            const count =
              tab.id === 'all'
                ? leaveRequests.length
                : leaveRequests.filter((l) => l.status === tab.id).length;

            return (
              <button
                key={tab.id}
                onClick={() => setFilterStatus(tab.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  isActive
                    ? 'text-white shadow-xs'
                    : 'bg-[#f4f4f2] text-[#737373] hover:text-[#171717] hover:bg-[#ececea]'
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

      {/* Leave Requests List */}
      <div className="space-y-3.5">
        {filteredRequests.map((req) => {
          const isPending = req.status === 'Pending';
          const isApproved = req.status === 'Approved';
          const isRejected = req.status === 'Rejected';
          const isExpanded = expandedRequestId === req.id;

          return (
            <div
              key={req.id}
              className="bg-white rounded-2xl border border-[#e7e7e4] p-4.5 sm:p-5 shadow-[0_8px_24px_rgba(0,0,0,0.06)] card-lift transition-all"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
                {/* Left details */}
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="text-sm font-bold text-[#171717]">
                      {req.facultyName}
                    </span>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-[#eef6f0] text-green-700">
                      {req.department}
                    </span>
                    <span className="text-[11px] font-bold text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded-md">
                      {req.daysCount} Day{req.daysCount > 1 ? 's' : ''} {req.leaveType ? `${req.leaveType} ` : ''}Leave
                    </span>

                    {/* Status Chip */}
                    {isPending && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-900 border border-amber-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                        Pending
                      </span>
                    )}
                    {isApproved && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100/80 text-amber-900 border border-amber-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                        {clock.dateStr >= req.fromDate && clock.dateStr <= req.toDate ? 'On Leave' : clock.dateStr > req.toDate ? 'Approved · Completed' : 'Approved'}
                      </span>
                    )}
                    {isRejected && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-50 text-red-800 border border-red-200">
                        <XCircle className="w-3 h-3 text-red-600" />
                        Rejected
                      </span>
                    )}
                  </div>

                  {/* Dates & Reason */}
                  <div className="text-[11px] text-[#737373] font-medium flex items-center gap-2.5 flex-wrap">
                    <span>
                      Schedule:{' '}
                      <strong className="text-[#171717] font-mono">
                        {req.fromDate}
                      </strong>{' '}
                      to{' '}
                      <strong className="text-[#171717] font-mono">
                        {req.toDate}
                      </strong>
                    </span>
                    <span>·</span>
                    <span>Submitted on {req.createdAt}</span>
                  </div>

                  <p className="text-[11px] text-[#171717] bg-[#fafaf9] p-2.5 rounded-xl border border-[#ececea] italic leading-relaxed">
                    &ldquo;{req.reason}&rdquo;
                  </p>

                  {/* Substitution info badge */}
                  {req.substitutions.length > 0 ? (
                    <div className="flex items-center gap-2 pt-0.5">
                      <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
                        <UserCheck className="w-3 h-3" />
                        {req.substitutions.length} class substitution(s) assigned
                      </span>
                      <button
                        onClick={() => toggleExpand(req.id)}
                        className="text-[11px] font-bold text-green-600 hover:text-green-800 inline-flex items-center gap-0.5 cursor-pointer ml-2"
                      >
                        <span>{isExpanded ? 'Hide schedule' : 'View substitute plan'}</span>
                        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                    </div>
                  ) : req.daysCount > 2 ? (
                    <div className="text-[11px] text-[#737373] flex items-center gap-1.5 pt-0.5">
                      <AlertTriangle className="w-3 h-3 text-amber-500" />
                      <span>Extended leave (&gt;2 days): Admin manual duty assignment required.</span>
                    </div>
                  ) : (
                    <div className="text-[11px] text-[#737373] pt-0.5">
                      {(() => {
                        // class_sessions tells us what actually happened to the missed periods
                        const cancelled = sessions.filter((x) => x.facultyId === req.facultyId && x.status === 'cancelled' && x.date >= req.fromDate && x.date <= req.toDate);
                        return cancelled.length
                          ? `No substitute assigned · ${cancelled.length} class${cancelled.length > 1 ? 'es' : ''} cancelled (${cancelled.map((x) => `${x.periodLabel} ${x.subject}`).join(', ')})`
                          : 'No regular scheduled classes fall on these selected dates.';
                      })()}
                    </div>
                  )}
                </div>

                {/* Right Action buttons */}
                <div className="flex items-center gap-2 self-start lg:self-center shrink-0 border-t lg:border-t-0 pt-2.5 lg:pt-0 border-[#f4f4f2] w-full lg:w-auto justify-end">
                  {isPending ? (
                    <>
                      <button
                        onClick={() => updateLeaveRequestStatus(req.id, 'Approved')}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Approve Leave</span>
                      </button>
                      <button
                        onClick={() => updateLeaveRequestStatus(req.id, 'Rejected')}
                        className="px-3 py-1.5 rounded-lg bg-white border border-red-200 text-red-600 hover:bg-red-50 font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>
                    </>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          updateLeaveRequestStatus(
                            req.id,
                            isApproved ? 'Rejected' : 'Approved'
                          )
                        }
                        className="text-[11px] text-[#737373] hover:text-[#171717] underline cursor-pointer"
                      >
                        Change to {isApproved ? 'Rejected' : 'Approved'}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Collapsible substitution schedule */}
              {isExpanded && req.substitutions.length > 0 && (
                <div className="mt-4 pt-4 border-t border-[#efefed] animate-in fade-in duration-150">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#737373] mb-2.5">
                    Assigned Class Substitutions
                  </h4>
                  <div className="space-y-2">
                    {req.substitutions.map((sub, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl border border-[#e7e7e4] bg-[#fafaf9] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                      >
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-[#171717]">
                            {sub.date} ({sub.day})
                          </span>
                          <span className="text-[#737373]">·</span>
                          <span className="font-mono text-green-700 bg-green-50 px-2 py-0.5 rounded font-semibold">
                            {sub.startTime}–{sub.endTime}
                          </span>
                          <span className="text-[#737373]">·</span>
                          <span className="font-medium text-[#171717]">
                            {sub.subject} (Sem {sub.semester} · {sub.section}{sub.room ? ` · ${sub.room}` : ''})
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 self-start sm:self-auto">
                          <span className="text-[#737373]">Substitute:</span>
                          <span className="font-bold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded">
                            {sub.substituteFacultyName}
                          </span>
                          {sub.status && (
                            <span className={`rounded px-2 py-0.5 text-[10px] font-bold ${sub.status === 'Approved' ? 'bg-[#e7f6ec] text-[#17803f]' : sub.status === 'Rejected' ? 'bg-[#fdecec] text-[#c2312f]' : 'bg-[#fff6df] text-[#a66c00]'}`}>
                              {sub.status}
                            </span>
                          )}
                        </div>
                        {sub.reviewNote && sub.status === 'Rejected' && (
                          <p className="w-full text-[11px] text-[#c2312f] sm:basis-full">Note: {sub.reviewNote}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {filteredRequests.length === 0 && (
          <div className="bg-white rounded-2xl border border-[#e7e7e4] p-12 text-center text-[#737373]">
            <p className="text-sm font-semibold">No leave requests found in this view.</p>
          </div>
        )}
      </div>
    </div>
  );
};
