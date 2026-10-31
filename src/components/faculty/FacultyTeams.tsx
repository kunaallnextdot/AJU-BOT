import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Search, Users, GraduationCap, MapPin, Filter } from 'lucide-react';

export const FacultyTeams: React.FC = () => {
  const { facultyList, getFacultyLiveStatus, currentTheme } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredFaculty = facultyList.filter((faculty) => {
    const statusDetail = getFacultyLiveStatus(faculty.id);

    const matchQuery =
      faculty.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faculty.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faculty.deptShort.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchQuery) return false;
    if (statusFilter === 'all') return true;
    return statusDetail.status === statusFilter;
  });

  return (
    <div className="space-y-4 sm:space-y-5 animate-in fade-in duration-200">
      {/* Top Header & Search */}
      <div className="bg-white rounded-2xl border border-[#dce8f7] p-3.5 sm:p-4 shadow-[0_6px_20px_rgba(31,76,126,0.05)] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div>
          <h2 className="text-xs sm:text-sm font-bold text-[#10233f] flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600" />
            <span>Academic Faculty Colleagues</span>
          </h2>
          <p className="text-[11px] text-[#657894] mt-0.5">
            Check colleague live availability and instructional locations across campus
          </p>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {[
            { id: 'all', label: 'All Colleagues' },
            { id: 'In Class', label: 'In Class' },
            { id: 'Free', label: 'Free Now' },
            { id: 'On Leave', label: 'On Leave' },
          ].map((f) => {
            const isActive = statusFilter === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setStatusFilter(f.id)}
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
        </div>
      </div>

      {/* Faculty Card Grid (NOT clickable in Faculty view) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5 sm:gap-4">
        {filteredFaculty.map((faculty) => {
          const statusDetail = getFacultyLiveStatus(faculty.id);
          const isTeaching = statusDetail.status === 'In Class';
          const isOnLeave = statusDetail.status === 'On Leave';

          return (
            <div
              key={faculty.id}
              className="bg-white rounded-2xl border border-[#dce8f7] p-4 sm:p-4.5 shadow-[0_6px_20px_rgba(31,76,126,0.05)] flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between mb-3.5">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm text-white shadow-xs shrink-0"
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

                <h3 className="text-sm font-bold text-[#10233f]">
                  {faculty.name}
                </h3>
                <p className="text-[11px] font-medium text-[#657894] mt-0.5">
                  {faculty.position}
                </p>

                <div className="mt-1.5 inline-block text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#eef5ff] text-[#657894]">
                  {faculty.department} ({faculty.deptShort})
                </div>

                {isTeaching && statusDetail.currentClass && (
                  <div className="mt-2.5 p-2 rounded-lg bg-blue-50/70 border border-blue-100 text-[10px] text-blue-900 font-medium">
                    Teaching <strong>{statusDetail.currentClass.subject}</strong> in {statusDetail.currentClass.room} ({statusDetail.currentClass.startTime}–{statusDetail.currentClass.endTime})
                  </div>
                )}
              </div>

              {/* Card Footer Info */}
              <div className="mt-4 pt-2.5 border-t border-[#eef5ff] flex items-center justify-between text-[11px] text-[#657894]">
                <span>Section: <strong className="text-[#10233f]">{faculty.currentSection}</strong></span>
                <span className="font-mono text-[10px]">{faculty.email}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
