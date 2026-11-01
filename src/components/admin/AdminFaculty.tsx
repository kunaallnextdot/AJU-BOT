import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { FacultyMember, FacultyLiveStatus } from '../../types';
import { FacultyDrawer } from './FacultyDrawer';
import { AddFacultyModal } from './AddFacultyModal';
import { Search, GraduationCap, CheckCircle2, BookOpen, ArrowUpRight, Filter, UserPlus, X } from 'lucide-react';

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
  const [showAddFaculty, setShowAddFaculty] = useState(false);
  const [addedFaculty, setAddedFaculty] = useState<{ faculty: FacultyMember; offline: boolean } | null>(null);

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
      <div className="bg-white rounded-2xl border border-[#dce8f7] p-3.5 sm:p-4 shadow-[0_6px_20px_rgba(31,76,126,0.05)] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#657894]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search faculty by name or department…"
            className="w-full pl-9 pr-3.5 py-1.5 bg-[#f8fbff] text-xs font-medium border border-[#dce8f7] rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:border-transparent transition-all placeholder:text-[#94a3b8]"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <span className="text-[11px] font-bold text-[#657894] uppercase tracking-wider mr-1 hidden sm:inline-flex items-center gap-1">
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
                    : 'bg-[#eef5ff] text-[#657894] hover:text-[#10233f] hover:bg-[#e2ecf9]'
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
          <button
            onClick={() => setShowAddFaculty(true)}
            className="ml-1 inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1 text-[11px] font-bold whitespace-nowrap text-white shadow-xs transition hover:opacity-90"
            style={{ background: `linear-gradient(135deg, ${currentTheme.primaryHex}, ${currentTheme.deepHex})` }}
          >
            <UserPlus className="h-3.5 w-3.5" /> Add Faculty
          </button>
        </div>
      </div>

      {addedFaculty && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs text-emerald-800">
          <span>
            <strong>{addedFaculty.faculty.name}</strong> was {addedFaculty.offline ? 'saved in this browser (offline) and will be uploaded when the database reconnects' : 'added'} to {addedFaculty.faculty.department}. They can sign in with their name or {addedFaculty.faculty.email}.
          </span>
          <button onClick={() => setAddedFaculty(null)} className="cursor-pointer rounded p-0.5 hover:bg-emerald-100" aria-label="Dismiss">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

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
              className="bg-white rounded-2xl border border-[#dce8f7] p-4 sm:p-4.5 card-lift cursor-pointer relative overflow-hidden group shadow-[0_6px_20px_rgba(31,76,126,0.05)] flex flex-col justify-between"
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
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-ping" />
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

                <h3 className="text-sm font-bold text-[#10233f] group-hover:text-blue-600 transition-colors leading-snug">
                  {faculty.name}
                </h3>
                <p className="text-[11px] font-medium text-[#657894] mt-0.5">
                  {faculty.position}
                </p>
                <div className="mt-1.5 inline-block text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#eef5ff] text-[#657894]">
                  {faculty.department} ({faculty.deptShort})
                </div>
                <p className="mt-1.5 text-[10px] text-[#657894]">
                  {[faculty.employeeCode, faculty.cabin && `Cabin ${faculty.cabin}`].filter(Boolean).join(' · ')}
                  {(() => {
                    const p = getFacultyPresence(faculty.id);
                    if (!p) return null;
                    return (
                      <span className={`ml-1.5 font-semibold ${p.status === 'In Campus' ? 'text-[#047857]' : p.status === 'On Leave' ? 'text-[#a66c00]' : 'text-[#657894]'}`}>
                        · {p.status}{p.checkIn ? ` ${p.checkIn}–${p.checkOut}` : ''}
                      </span>
                    );
                  })()}
                </p>

                {/* Current teaching slot description if active */}
                {isTeaching && statusDetail.currentClass && (
                  <div className="mt-2.5 p-2 rounded-lg bg-blue-50/70 border border-blue-100 text-[10px] text-blue-900 font-medium">
                    Teaching <strong>{statusDetail.currentClass.subject}</strong> in {statusDetail.currentClass.room} ({statusDetail.currentClass.startTime}–{statusDetail.currentClass.endTime})
                  </div>
                )}
              </div>

              {/* Stats Row: Sec + section number, modules done */}
              <div className="mt-4 pt-3.5 border-t border-[#eef5ff]">
                <div className="grid grid-cols-2 gap-3 text-xs mb-2.5">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#657894] tracking-wider block">
                      Section
                    </span>
                    <span className="font-bold text-[#10233f] text-xs">
                      {faculty.currentSection}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#657894] tracking-wider block">
                      Modules Done
                    </span>
                    <span className="font-mono font-bold text-[#10233f] text-xs">
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
                <div className="flex items-center justify-between text-[11px] font-semibold text-blue-600 pt-0.5 group-hover:underline">
                  <span>View Syllabus Breakdown</span>
                  <ArrowUpRight className="w-3 h-3" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredFaculty.length === 0 && (
        <div className="bg-white rounded-2xl border border-[#dce8f7] p-12 text-center text-[#657894] shadow-xs">
          <p className="text-sm font-semibold">No faculty members found matching this filter.</p>
          <button
            onClick={() => {
              setActiveFilter('all');
              setSearchQuery('');
            }}
            className="mt-3 px-4 py-2 rounded-lg bg-blue-50 text-blue-600 text-xs font-bold hover:bg-blue-100 transition-colors cursor-pointer"
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

      {showAddFaculty && (
        <AddFacultyModal
          onClose={() => setShowAddFaculty(false)}
          onAdded={(faculty, offline) => {
            setShowAddFaculty(false);
            setAddedFaculty({ faculty, offline });
            setActiveFilter('all');
            setSearchQuery('');
          }}
        />
      )}
    </div>
  );
};
