import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { FacultyMember, ClassPeriod, SubstitutionSlot, WeekDay } from '../../types';
import { PERIOD_SLOTS } from '../../data/mockData';
import { Clock, Calendar, MapPin, UserCheck, AlertCircle } from 'lucide-react';

interface FacultyTimetableProps {
  faculty: FacultyMember;
}

export const FacultyTimetable: React.FC<FacultyTimetableProps> = ({ faculty }) => {
  const { clock, currentTheme, leaveRequests } = useApp();

  // Saturday only appears when the timetable actually schedules something on it
  const days: WeekDay[] = (['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as WeekDay[]).filter(
    (d) => d !== 'Saturday' || faculty.timetable.some((c) => c.day === 'Saturday')
  );

  const timeToMins = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };

  const currentMins = timeToMins(clock.timeStr);

  // Requirement 4: Find all peer substitute assignments where this faculty is covering for another colleague
  const substituteSlots = useMemo(() => {
    const list: {
      sub: SubstitutionSlot;
      requestingFacultyName: string;
      department: string;
      reason: string;
      status: string;
    }[] = [];

    leaveRequests.forEach((req) => {
      // Include confirmed (Approved) as well as Pending mapped requests
      if (req.status === 'Approved' || req.status === 'Pending') {
        req.substitutions.forEach((s) => {
          if (s.substituteFacultyId === faculty.id) {
            list.push({
              sub: s,
              requestingFacultyName: req.facultyName,
              department: req.department,
              reason: req.reason,
              status: req.status,
            });
          }
        });
      }
    });

    return list;
  }, [leaveRequests, faculty.id]);

  return (
    <div className="space-y-4 sm:space-y-5 animate-in fade-in duration-200">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl border border-[#dce8f7] p-3.5 sm:p-4 shadow-[0_6px_20px_rgba(31,76,126,0.05)] flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div>
          <h2 className="text-xs sm:text-sm font-bold text-[#10233f] flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600" />
            <span>Master Instructional Teaching Timetable</span>
          </h2>
          <p className="text-[11px] text-[#657894] mt-0.5">
            Weekly timetable and peer substitution commitments for <strong className="text-[#10233f]">{faculty.name}</strong> ({faculty.department})
          </p>
        </div>

        <div className="flex items-center gap-2">
          {substituteSlots.length > 0 && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-50 border border-amber-300 text-[11px] font-bold text-amber-900">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span>{substituteSlots.length} Substitute Period{substituteSlots.length > 1 ? 's' : ''} Assigned</span>
            </span>
          )}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#eef5ff] border border-[#dce8f7] text-[11px] font-semibold text-[#10233f]">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
            <span>Today: <strong>{clock.dayName}</strong></span>
          </div>
        </div>
      </div>

      {/* Notice Banner for Peer Substitutions */}
      {substituteSlots.length > 0 && (
        <div className="p-3 rounded-xl bg-gradient-to-r from-amber-50 via-amber-50/80 to-amber-100/50 border border-amber-300 text-xs text-amber-950 flex items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-amber-600 shrink-0" />
            <div className="text-[11px] leading-snug">
              <strong>Notice for Substitute Duties:</strong> You have <strong>{substituteSlots.length} peer substitute class(es)</strong> scheduled. They are highlighted below with dashed amber borders and the <span className="font-bold uppercase text-amber-800 bg-amber-200/70 px-1 py-0.2 rounded text-[10px]">Substitute</span> badge.
            </div>
          </div>
        </div>
      )}

      {/* Timetable Weekly Grid */}
      <div className="bg-white rounded-2xl border border-[#dce8f7] p-3.5 sm:p-5 shadow-[0_8px_24px_rgba(31,76,126,0.06)] overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-left">
          <thead>
            <tr>
              <th className="p-2.5 w-28 bg-[#f8fbff] text-[10px] font-bold uppercase tracking-wider text-[#657894] border-b border-r border-[#dce8f7] rounded-tl-xl">
                Period / Time
              </th>
              {days.map((day, idx) => {
                const isCurrentDay = clock.dayName === day;

                return (
                  <th
                    key={day}
                    className={`p-2.5 text-center text-[11px] font-bold border-b border-r last:border-r-0 border-[#dce8f7] transition-colors ${
                      isCurrentDay
                        ? 'bg-blue-50/70 text-blue-900 border-b-2'
                        : 'bg-[#f8fbff] text-[#10233f]'
                    } ${idx === days.length - 1 ? 'rounded-tr-xl' : ''}`}
                    style={{
                      borderBottomColor: isCurrentDay ? currentTheme.primaryHex : undefined,
                    }}
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      <span>{day}</span>
                      {isCurrentDay && (
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {PERIOD_SLOTS.map((slot) => {
              return (
                <tr
                  key={slot.periodNumber}
                  className="hover:bg-[#f8fbff] transition-colors border-b border-[#eaf2fc] last:border-b-0"
                >
                  {/* Period Time Column */}
                  <td className="p-2.5 bg-[#f8fbff] border-r border-[#dce8f7] align-top">
                    <div className="text-[11px] font-bold text-[#10233f]">
                      {slot.label}
                    </div>
                    <div className="text-[10px] font-mono text-[#657894] mt-0.5">
                      {slot.startTime}–{slot.endTime}
                    </div>
                  </td>

                  {/* Day Columns */}
                  {days.map((day) => {
                    const classCell = faculty.timetable.find(
                      (c) =>
                        c.day === day &&
                        (c.periodNumber === slot.periodNumber ||
                          c.startTime === slot.startTime)
                    );

                    // Check if this faculty is assigned as a substitute teacher at this slot
                    const subItem = substituteSlots.find(
                      (item) =>
                        item.sub.day === day &&
                        (item.sub.periodNumber === slot.periodNumber ||
                          item.sub.startTime === slot.startTime)
                    );

                    const isCurrentDay = clock.dayName === day;
                    const isNow =
                      isCurrentDay &&
                      ((classCell &&
                        currentMins >= timeToMins(classCell.startTime) &&
                        currentMins <= timeToMins(classCell.endTime)) ||
                        (subItem &&
                          currentMins >= timeToMins(subItem.sub.startTime) &&
                          currentMins <= timeToMins(subItem.sub.endTime)));

                    return (
                      <td
                        key={day}
                        className={`p-2 border-r last:border-r-0 border-[#eaf2fc] align-top transition-all ${
                          isNow
                            ? 'bg-blue-50/90 ring-1 ring-inset ring-blue-500 shadow-xs'
                            : isCurrentDay
                            ? 'bg-[#f8fbff]'
                            : ''
                        }`}
                      >
                        {/* Requirement 4: Distinct treatment for Substitute Class */}
                        {subItem ? (
                          <div
                            className="p-2 rounded-xl border-2 border-dashed border-amber-400 bg-amber-50/90 hover:bg-amber-100/90 flex flex-col justify-between h-full min-h-[76px] transition-all card-lift relative group"
                            title={`Substitute Assignment: Covering for ${subItem.requestingFacultyName} (${subItem.department}) for ${subItem.sub.subject} on ${subItem.sub.date}. Reason: ${subItem.reason}`}
                          >
                            <div>
                              <div className="flex items-center justify-between gap-1 mb-1">
                                <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-amber-500 text-white shadow-2xs flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                  Substitute
                                </span>
                                <span className="text-[9px] font-mono font-bold text-amber-900 bg-amber-200/70 px-1 py-0.2 rounded">
                                  {subItem.sub.date}
                                </span>
                              </div>
                              <p className="font-extrabold text-[11px] text-[#10233f] leading-snug">
                                {subItem.sub.subject}
                              </p>
                              <div className="text-[10px] font-bold text-amber-800 mt-1 flex items-center gap-1">
                                <UserCheck className="w-3 h-3 text-amber-600 shrink-0" />
                                <span className="truncate">Covering: {subItem.requestingFacultyName}</span>
                              </div>
                            </div>

                            <div className="mt-1.5 pt-1 border-t border-amber-200/80 flex items-center justify-between text-[10px] text-amber-900">
                              <span className="font-semibold">
                                Sem {subItem.sub.semester} · Sec {subItem.sub.section}
                              </span>
                              <span className="font-mono text-[9px] text-amber-700">
                                Period {subItem.sub.periodNumber}
                              </span>
                            </div>
                          </div>
                        ) : classCell ? (
                          <div
                            className={`p-2 rounded-xl border flex flex-col justify-between h-full min-h-[76px] transition-all card-lift ${
                              isNow
                                ? 'bg-white border-blue-400 shadow-xs'
                                : 'bg-white border-[#dce8f7] hover:border-blue-300'
                            }`}
                          >
                            <div>
                              <div className="flex items-center justify-between gap-1 mb-1">
                                <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-[#eff6ff] text-blue-700">
                                  {classCell.subjectCode}
                                </span>
                                {isNow && (
                                  <span className="text-[8px] font-extrabold uppercase px-1 py-0.2 rounded bg-blue-600 text-white animate-pulse">
                                    NOW
                                  </span>
                                )}
                              </div>
                              <p className="font-extrabold text-[11px] text-[#10233f] leading-tight line-clamp-2">
                                {classCell.subject}
                              </p>
                            </div>

                            <div className="mt-1.5 pt-1 border-t border-[#eef5ff] flex items-center justify-between text-[10px] text-[#657894]">
                              <span className="font-semibold text-[#10233f]">
                                Sem {classCell.semester} · {classCell.section}
                              </span>
                              <span className="flex items-center gap-0.5 text-[9px]">
                                <MapPin className="w-2.5 h-2.5" />
                                {classCell.room}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="min-h-[76px] flex items-center justify-center text-[10px] text-[#cbd5e1] font-medium italic">
                            —
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
