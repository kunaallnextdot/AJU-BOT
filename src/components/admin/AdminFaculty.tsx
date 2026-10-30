import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { FacultyMember, FacultyLiveStatus } from '../../types';
import { FacultyDrawer } from './FacultyDrawer';
import { Search, GraduationCap, CheckCircle2, BookOpen, ArrowUpRight, Filter } from 'lucide-react';

interface AdminFacultyProps {
  initialFilter?: string;
  selectedFacultyId?: string | null;
  onClearSelectedFaculty?: () => void;
}

export const AdminFaculty: React.FC<AdminFacultyProps> = ({
  initialFilter = 'all',
  selectedFacultyId = null,
  onClearSelectedFaculty,
}) => {
  const { facultyList, getFacultyLiveStatus, getFacultyPresence, currentTheme } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>(initialFilter);
  const [activeDrawerFaculty, setActiveDrawerFaculty] = useState<FacultyMember | null>(() => {
    if (selectedFacultyId) {
      return facultyList.find((f) => f.id === selectedFacultyId) || null;
    }
    return null;
  });

  const handleCardClick = (faculty: FacultyMember) => {
    setActiveDrawerFaculty(faculty);
  };

  const handleCloseDrawer = () => {
    setActiveDrawerFaculty(null);
    if (onClearSelectedFaculty) onClearSelectedFaculty();
  };

  // Filter faculty by search and live status
  const filteredFaculty = facultyList.filter((faculty) => {
    const statusDetail = getFacultyLiveStatus(faculty.id);

    // Search query
    const matchQuery =
      faculty.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faculty.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faculty.deptShort.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchQuery) return false;

    // Status filter
    if (activeFilter === 'all') return true;
    return statusDetail.status === activeFilter;
  });

  return (
    <div className="space-y-4 sm:space-y-5 animate-in fade-in duration-200">
      {/* Top Controls & Filter Bar */}
      <div className="bg-white rounded-2xl border border-[#e7e7e4] p-3.5 sm:p-4 shadow-[0_6px_20px_rgba(0,0,0,0.05)] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#737373]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search faculty by name or department…"
            className="w-full pl-9 pr-3.5 py-1.5 bg-[#fafaf9] text-xs font-medium border border-[#e7e7e4] rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:border-transparent transition-all placeholder:text-[#a3a3a3]"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <span className="text-[11px] font-bold text-[#737373] uppercase tracking-wider mr-1 hidden sm:inline-flex items-center gap-1">
            <Filter className="w-3 h-3" /> Filter:
          </span>
          {[
            { id: 'all', label: 'All Faculty' },
            { id: 'In Class', label: 'In Class' },
            { id: 'Free', label: 'Free Now' },
            { id: 'On Leave', label: 'On Leave' },
          ].map((f) => {
            const isActive = activeFilter === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setActiveFilter(f.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer ${
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
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Center-Aligned Responsive Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5 sm:gap-4">
        {filteredFaculty.map((faculty) => {
          const statusDetail = getFacultyLiveStatus(faculty.id);
          const isTeaching = statusDetail.status === 'In Class';
          const isOnLeave = statusDetail.status === 'On Leave';

          // Modules done
          const allModules = faculty.subjects.flatMap((s) => s.modules);
          const completedModules = allModules.filter((m) => m.completed).length;
          const percent = allModules.length
            ? Math.round((completedModules / allModules.length) * 100)
            : 0;

          return (
            <div
              key={faculty.id}
              onClick={() => handleCardClick(faculty)}
              className="bg-white rounded-2xl border border-[#e7e7e4] p-4 sm:p-4.5 card-lift cursor-pointer relative overflow-hidden group shadow-[0_6px_20px_rgba(0,0,0,0.05)] flex flex-col justify-between"
            >
              {/* Card Top: Avatar, Name, Position */}
              <div>
                <div className="flex items-start justify-between mb-3.5">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm text-white shadow-xs group-hover:scale-105 transition-transform shrink-0"
                    style={{
                      background: `linear-gradient(135deg, ${currentTheme.primaryHex}, ${currentTheme.deepHex})`,
                    }}
                  >
                    {faculty.avatarInitials}
                  </div>

                  {/* Live Status Chip */}
                  {isTeaching ? (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-green-50 text-green-700 border border-green-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-600 animate-ping" />
                      <span>In Class</span>
                    </span>
                  ) : isOnLeave ? (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      <span>On Leave</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span>Free</span>
                    </span>
                  )}
                </div>

                <h3 className="text-sm font-bold text-[#171717] group-hover:text-green-600 transition-colors leading-snug">
                  {faculty.name}
                </h3>
                <p className="text-[11px] font-medium text-[#737373] mt-0.5">
                  {faculty.position}
                </p>
                <div className="mt-1.5 inline-block text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#f4f4f2] text-[#737373]">
                  {faculty.department} ({faculty.deptShort})
                </div>
                <p className="mt-1.5 text-[10px] text-[#737373]">
                  {faculty.employeeCode} · Cabin {faculty.cabin}
                  {(() => {
                    const p = getFacultyPresence(faculty.id);
                    if (!p) return null;
                    return (
                      <span className={`ml-1.5 font-semibold ${p.status === 'In Campus' ? 'text-[#17803f]' : p.status === 'On Leave' ? 'text-[#a66c00]' : 'text-[#737373]'}`}>
                        · {p.status}{p.checkIn ? ` ${p.checkIn}–${p.checkOut}` : ''}
                      </span>
                    );
                  })()}
                </p>

                {/* Current teaching slot description if active */}
                {isTeaching && statusDetail.currentClass && (
                  <div className="mt-2.5 p-2 rounded-lg bg-green-50/70 border border-green-100 text-[10px] text-green-900 font-medium">
                    Teaching <strong>{statusDetail.currentClass.subject}</strong> in {statusDetail.currentClass.room} ({statusDetail.currentClass.startTime}–{statusDetail.currentClass.endTime})
                  </div>
                )}
              </div>

              {/* Stats Row: Sec + section number, modules done */}
              <div className="mt-4 pt-3.5 border-t border-[#f4f4f2]">
                <div className="grid grid-cols-2 gap-3 text-xs mb-2.5">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#737373] tracking-wider block">
                      Section
                    </span>
                    <span className="font-bold text-[#171717] text-xs">
                      {faculty.currentSection}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#737373] tracking-wider block">
                      Modules Done
                    </span>
                    <span className="font-mono font-bold text-[#171717] text-xs">
                      {completedModules}/{allModules.length} ({percent}%)
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mb-2.5">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${percent}%`,
                      backgroundColor: currentTheme.primaryHex,
                    }}
                  />
                </div>

                {/* Footer action trigger */}
                <div className="flex items-center justify-between text-[11px] font-semibold text-green-600 pt-0.5 group-hover:underline">
                  <span>View Syllabus Breakdown</span>
                  <ArrowUpRight className="w-3 h-3" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredFaculty.length === 0 && (
        <div className="bg-white rounded-2xl border border-[#e7e7e4] p-12 text-center text-[#737373] shadow-xs">
          <p className="text-sm font-semibold">No faculty members found matching this filter.</p>
          <button
            onClick={() => {
              setActiveFilter('all');
              setSearchQuery('');
            }}
            className="mt-3 px-4 py-2 rounded-lg bg-green-50 text-green-600 text-xs font-bold hover:bg-green-100 transition-colors cursor-pointer"
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* Slide-in Right Panel */}
      {activeDrawerFaculty && (
        <FacultyDrawer
          faculty={activeDrawerFaculty}
          onClose={handleCloseDrawer}
          isReadOnly={true}
        />
      )}
    </div>
  );
};
