import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { HolidayType } from '../../types';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Sparkles,
  Info,
} from 'lucide-react';

export const AcademicCalendar: React.FC = () => {
  const { holidays, clock, currentTheme } = useApp();

  // Parse clock date for initial month view (e.g. 2026-10-06)
  const initialDate = new Date(clock.dateStr);
  const [currentYear, setCurrentYear] = useState(
    isNaN(initialDate.getFullYear()) ? 2026 : initialDate.getFullYear()
  );
  const [currentMonth, setCurrentMonth] = useState(
    isNaN(initialDate.getMonth()) ? 9 : initialDate.getMonth() // 0-indexed: 9 = October
  );

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const handleToday = () => {
    const today = new Date(clock.dateStr);
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
  };

  // Generate days for current month grid
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay(); // 0 is Sun
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();
  const leadingDays = firstDayOfMonth; // blank cells before day 1

  const formatHolidayDate = (day: number) => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${currentYear}-${pad(currentMonth + 1)}-${pad(day)}`;
  };

  // Map holidays by date
  const holidaysMap = new Map<string, typeof holidays[0]>();
  holidays.forEach((h) => holidaysMap.set(h.date, h));

  // Type styling
  const getTypeBadge = (type: HolidayType) => {
    switch (type) {
      case 'festival':
        return {
          bg: 'bg-rose-50 border-rose-200 text-rose-700',
          dot: 'bg-rose-500',
          label: 'Festival / Gazetted',
        };
      case 'restricted':
        return {
          bg: 'bg-amber-50 border-amber-200 text-amber-700',
          dot: 'bg-amber-500',
          label: 'Restricted Optional',
        };
      case 'observance':
        return {
          bg: 'bg-purple-50 border-purple-200 text-purple-700',
          dot: 'bg-purple-500',
          label: 'Institutional Observance',
        };
      case 'saturday':
        return {
          bg: 'bg-blue-50 border-blue-200 text-blue-700',
          dot: 'bg-blue-500',
          label: 'Institutional Saturday Off',
        };
    }
  };

  return (
    <div className="space-y-4 sm:space-y-5 animate-in fade-in duration-200">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl border border-[#dce8f7] p-3.5 sm:p-4 shadow-[0_6px_20px_rgba(31,76,126,0.05)] flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-[#10233f] flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-blue-600" />
            <span>Academic Session Calendar</span>
          </h2>
          <p className="text-[11px] text-[#657894] mt-0.5">
            Institutional gazetted holidays, festival vacations & scheduled off-days
          </p>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleToday}
            className="px-2.5 py-1 rounded-lg border border-[#dce8f7] bg-white hover:bg-[#eef5ff] text-[11px] font-bold text-[#10233f] transition-colors cursor-pointer"
          >
            Today
          </button>
          <div className="flex items-center gap-1 bg-[#f8fbff] p-1 rounded-xl border border-[#dce8f7]">
            <button
              onClick={handlePrevMonth}
              className="p-1 rounded-lg text-[#657894] hover:text-[#10233f] hover:bg-white transition-colors cursor-pointer"
              aria-label="Previous month"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-bold text-[#10233f] px-2.5 font-mono">
              {monthNames[currentMonth]} {currentYear}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-1 rounded-lg text-[#657894] hover:text-[#10233f] hover:bg-white transition-colors cursor-pointer"
              aria-label="Next month"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 flex-wrap text-xs font-semibold px-2">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
          <span className="text-[#657894]">Festival / Gazetted</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
          <span className="text-[#657894]">Saturday Off</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          <span className="text-[#657894]">Restricted Holiday</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
          <span className="text-[#657894]">Observance</span>
        </div>
      </div>

      {/* Month Grid */}
      <div className="bg-white rounded-2xl border border-[#dce8f7] p-2.5 sm:p-6 shadow-[0_10px_30px_rgba(31,76,126,0.06)]">
        {/* Days of week header */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2 text-center">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <div
              key={d}
              className="text-[9px] sm:text-[11px] font-bold uppercase tracking-wider text-[#657894] py-1"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Days Cells */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {/* Leading days from prev month */}
          {Array.from({ length: leadingDays }).map((_, i) => (
            <div
              key={`prev-${i}`}
              className="min-h-14 overflow-hidden p-1 sm:min-h-22 sm:p-2 rounded-xl bg-[#f8fbff] border border-transparent text-[#cbd5e1] text-xs font-mono select-none"
            >
              {prevMonthDays - leadingDays + i + 1}
            </div>
          ))}

          {/* Current month days */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const dateStr = formatHolidayDate(dayNum);
            const holiday = holidaysMap.get(dateStr);
            const isToday = dateStr === clock.dateStr;

            return (
              <div
                key={dayNum}
                className={`min-h-16 min-w-0 overflow-hidden p-1 sm:min-h-24 sm:p-2.5 rounded-xl border transition-all flex flex-col justify-between ${
                  isToday
                    ? 'bg-blue-50/40 shadow-xs'
                    : 'bg-white hover:bg-[#f8fbff] border-[#eaf2fc]'
                }`}
                style={{
                  borderColor: isToday ? currentTheme.primaryHex : undefined,
                  borderWidth: isToday ? '2px' : '1px',
                }}
              >
                {/* Day number & indicators */}
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-bold font-mono ${
                      isToday
                        ? 'text-blue-700 font-extrabold text-sm'
                        : 'text-[#10233f]'
                    }`}
                  >
                    {dayNum}
                  </span>
                  {isToday && (
                    <span
                      className="hidden sm:inline text-[9px] font-bold px-1.5 py-0.2 rounded text-white font-sans"
                      style={{ backgroundColor: currentTheme.primaryHex }}
                    >
                      Today
                    </span>
                  )}
                </div>

                {/* Holiday pill if any */}
                {holiday && (
                  <div
                    className={`mt-1 p-0.5 sm:mt-1.5 sm:p-1.5 rounded-lg border text-[8px] sm:text-[10px] font-semibold leading-tight flex flex-col gap-0.5 ${
                      getTypeBadge(holiday.type).bg
                    }`}
                    title={holiday.description}
                  >
                    <div className="flex items-center gap-1">
                      <span
                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                          getTypeBadge(holiday.type).dot
                        }`}
                      />
                      <span className="truncate">{holiday.title}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Upcoming Holidays Summary List */}
      <div className="bg-white rounded-2xl border border-[#dce8f7] p-5 sm:p-6 shadow-[0_8px_24px_rgba(31,76,126,0.06)]">
        <h3 className="text-sm font-bold text-[#10233f] mb-3">
          Institutional Holidays Scheduled for Current Semester
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {holidays.map((h) => {
            const badge = getTypeBadge(h.type);
            return (
              <div
                key={h.id}
                className="p-3 rounded-xl border border-[#eaf2fc] bg-[#f8fbff] flex flex-col justify-between gap-1 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-[#10233f] text-xs">
                    {h.date}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.bg}`}>
                    {badge.label}
                  </span>
                </div>
                <p className="font-bold text-[#10233f] mt-1">{h.title}</p>
                <p className="text-[11px] text-[#657894]">{h.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
