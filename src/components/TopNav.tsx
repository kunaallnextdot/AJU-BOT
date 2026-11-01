import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Bell, CheckCircle2, ChevronDown, Clock, Menu, Search, XCircle } from 'lucide-react';

interface TopNavProps {
  title: string;
  onOpenMobileMenu: () => void;
  onOpenLeaveRequests?: () => void;
  onNavigate?: (tab: string) => void;
}

const ADMIN_PAGES = [
  { tab: 'dashboard', label: 'Dashboard' },
  { tab: 'faculty', label: 'Faculty Directory' },
  { tab: 'leave', label: 'Leave & Substitution' },
  { tab: 'calendar', label: 'Academic Calendar' },
  { tab: 'settings', label: 'Settings' },
];

const FACULTY_PAGES = [
  { tab: 'my-day', label: 'My Day' },
  { tab: 'dashboard', label: 'Dashboard' },
  { tab: 'timetable', label: 'Timetable' },
  { tab: 'faculty', label: 'Teams' },
  { tab: 'leave', label: 'Leave & Substitution' },
  { tab: 'calendar', label: 'Calendar' },
  { tab: 'settings', label: 'Settings' },
];

export const TopNav: React.FC<TopNavProps> = ({ title, onOpenMobileMenu, onOpenLeaveRequests, onNavigate }) => {
  const { currentUser, currentTheme, clock, leaveRequests, updateLeaveRequestStatus, facultyList, dataSource } = useApp();
  const [query, setQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [showProfilePopover, setShowProfilePopover] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  if (!currentUser) return null;

  const isAdmin = currentUser.role === 'admin';
  const pendingLeaves = leaveRequests.filter((request) => request.status === 'Pending');

  // Quick jump: match pages and faculty names, both land on a workspace tab
  const q = query.trim().toLowerCase();
  const searchResults = q
    ? [
        ...(isAdmin ? ADMIN_PAGES : FACULTY_PAGES)
          .filter((page) => page.label.toLowerCase().includes(q))
          .map((page) => ({ key: `p-${page.tab}`, label: page.label, hint: 'Page', tab: page.tab })),
        ...facultyList
          .filter((f) => `${f.name} ${f.department} ${f.deptShort}`.toLowerCase().includes(q))
          .slice(0, 5)
          .map((f) => ({ key: `f-${f.id}`, label: f.name, hint: `${f.deptShort} · ${f.position}`, tab: 'faculty' })),
      ]
    : [];

  // Format 24hr time to a friendly 12hr display with AM/PM
  const formatTimeDisplay = (time24: string) => {
    const [h, m] = time24.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 === 0 ? 12 : h % 12;
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${displayH}:${pad(m)} ${period}`;
  };

  return (
    <header className="h-14 px-4 sm:px-6 bg-white border-b border-[#dce8f7] flex items-center justify-between sticky top-0 z-30 shadow-xs">
      {/* Left zone: Mobile toggle + Breadcrumb Title */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-1.5 rounded-lg text-[#657894] hover:text-[#10233f] hover:bg-[#f0f5fc] transition-colors"
          aria-label="Open navigation"
        >
          <Menu className="w-4 h-4" />
        </button>

        <h1 className="max-w-[46vw] truncate text-xs font-bold tracking-tight text-[#10233f] sm:text-[13.5px] lg:max-w-none">{title}</h1>
      </div>

      {/* Center zone: quick search */}
      <div className="relative mx-4 hidden max-w-xl flex-1 md:block lg:mx-8">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#8494aa]" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setTimeout(() => setSearchFocused(false), 120)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && searchResults[0]) {
              onNavigate?.(searchResults[0].tab);
              setQuery('');
            }
            if (e.key === 'Escape') setQuery('');
          }}
          placeholder="Search pages or faculty..."
          className="w-full rounded-xl border border-[#dce8f7] bg-[#f8fbff] py-1.5 pl-9 pr-4 text-xs text-[#10233f] placeholder:text-[#8494aa] transition focus:border-blue-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
        />
        {searchFocused && q && (
          <div className="absolute left-0 right-0 top-10 z-50 overflow-hidden rounded-xl border border-[#dce8f7] bg-white p-1.5 shadow-[0_16px_36px_rgba(31,76,126,0.14)]">
            {searchResults.length === 0 ? (
              <p className="px-3 py-4 text-center text-xs text-[#657894]">No matches for “{query}”</p>
            ) : (
              searchResults.map((r) => (
                <button
                  key={r.key}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    onNavigate?.(r.tab);
                    setQuery('');
                  }}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs hover:bg-[#f6faff]"
                >
                  <span className="font-medium text-[#10233f]">{r.label}</span>
                  <span className="text-[11px] text-[#8494aa]">{r.hint}</span>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Right zone: Live Real-time Clock (Clean, No dropdown) + Hover Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {isAdmin && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowNotifications((open) => !open)}
              className={`relative flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border shadow-xs transition ${showNotifications ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-[#dce8f7] bg-[#f8fbff] text-[#657894] hover:border-blue-200 hover:text-[#10233f]'}`}
              aria-label={`${pendingLeaves.length} pending leave requests`}
            >
              <Bell className="h-3.5 w-3.5" />
              {pendingLeaves.length > 0 && <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-white bg-red-500 px-1 text-[9px] font-extrabold text-white shadow-sm">{pendingLeaves.length}</span>}
            </button>
            {showNotifications && <div className="absolute right-0 top-10 z-50 w-[min(320px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-[#dce8f7] bg-white shadow-[0_16px_36px_rgba(31,76,126,0.14)]">
              <div className="flex items-center justify-between border-b border-[#eaf2fc] px-4 py-3"><div><p className="text-[13px] font-bold text-[#10233f]">Pending requests</p><p className="mt-0.5 text-[10px] text-[#657894]">Needs an admin decision</p></div><span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">{pendingLeaves.length} open</span></div>
              <div className="max-h-72 overflow-y-auto p-2">{pendingLeaves.length === 0 ? <div className="px-3 py-8 text-center text-xs text-[#657894]">You&apos;re all caught up.</div> : pendingLeaves.slice(0, 4).map((request) => <div key={request.id} className="rounded-xl px-3 py-3 transition hover:bg-[#f0f6ff]"><div className="flex items-start gap-2"><span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#f59e0b]" /><div className="min-w-0 flex-1"><p className="truncate text-xs font-extrabold text-[#10233f]">{request.facultyName}</p><p className="mt-0.5 truncate text-[10px] text-[#657894]">{request.department} · {request.daysCount} days</p><p className="mt-1 line-clamp-2 text-[10px] leading-4 text-[#657894]">{request.reason}</p><div className="mt-2 flex items-center gap-1.5"><button onClick={() => updateLeaveRequestStatus(request.id, 'Approved')} className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2 py-1 text-[10px] font-bold text-white"><CheckCircle2 className="h-3 w-3" /> Approve</button><button onClick={() => updateLeaveRequestStatus(request.id, 'Rejected')} className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2 py-1 text-[10px] font-bold text-red-600"><XCircle className="h-3 w-3" /> Reject</button></div></div></div></div>)}</div>
              <button onClick={() => { setShowNotifications(false); onOpenLeaveRequests?.(); }} className="flex w-full items-center justify-center gap-1 border-t border-[#eaf2fc] bg-[#f8fbff] px-4 py-2.5 text-[11px] font-bold text-blue-600 hover:bg-blue-50 hover:text-blue-800">Open leave management <span>→</span></button>
            </div>}
          </div>
        )}
        {/* Data source: live Supabase vs bundled offline snapshot */}
        <span
          className="hidden items-center gap-1.5 rounded-lg border border-[#e7e7e4] bg-white px-2.5 py-1.5 text-[11px] font-semibold text-[#404040] lg:inline-flex"
          title={dataSource === 'supabase' ? 'Faculty and leave data are live from Supabase' : dataSource === 'loading' ? 'Connecting to Supabase…' : 'Showing the bundled offline copy of the database'}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${dataSource === 'supabase' ? 'bg-[#1f9d55]' : dataSource === 'loading' ? 'animate-pulse bg-[#d08a1e]' : 'bg-[#a3a3a3]'}`} />
          {dataSource === 'supabase' ? 'Live data' : dataSource === 'loading' ? 'Connecting…' : 'Offline data'}
        </span>

        {/* Live Academic Clock Badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-[#dce8f7] bg-[#f8fbff] text-[11px] font-semibold text-[#10233f] shadow-xs select-none">
          <Clock
            className="w-3 h-3 shrink-0"
            style={{ color: currentTheme.primaryHex }}
          />
          <span className="font-semibold text-[#10233f]">
            {clock.dayName}
          </span>
          <span className="text-[#cbd5e1] font-light">·</span>
          <span className="font-mono tabular-nums font-bold text-[#10233f]">
            {formatTimeDisplay(clock.timeStr)}
          </span>
          <span
            className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse ml-0.5"
            title="Live synchronized clock"
          />
        </div>

        {/* Top-Right Profile Avatar with Hover Popover */}
        <div
          className="relative"
          onMouseEnter={() => setShowProfilePopover(true)}
          onMouseLeave={() => setShowProfilePopover(false)}
          onFocus={() => setShowProfilePopover(true)}
          onBlur={() => setShowProfilePopover(false)}
          tabIndex={0}
        >
          <div className="flex cursor-pointer items-center gap-2.5">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white shadow-xs transition-transform hover:scale-105"
              style={{
                background: `linear-gradient(135deg, ${currentTheme.primaryHex}, ${currentTheme.deepHex})`,
              }}
            >
              {currentUser.avatarInitials}
            </div>
            <div className="hidden leading-tight xl:block">
              <p className="text-xs font-bold text-[#10233f]">{currentUser.name.split(' ').slice(0, 2).join(' ')}</p>
              <p className="text-[11px] font-medium text-[#657894]">{isAdmin ? 'Admin' : (currentUser as any).deptShort + ' Faculty'}</p>
            </div>
            <ChevronDown className="hidden h-3.5 w-3.5 text-[#657894] xl:block" />
          </div>

          {/* Popover / Tooltip */}
          {showProfilePopover && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl border border-[#dce8f7] shadow-xl p-3 z-50 pointer-events-none transition-all duration-150">
              <div className="flex items-center gap-2.5 mb-2">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white shrink-0"
                  style={{
                    background: `linear-gradient(135deg, ${currentTheme.primaryHex}, ${currentTheme.deepHex})`,
                  }}
                >
                  {currentUser.avatarInitials}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[#10233f] truncate">
                    {currentUser.name}
                  </p>
                  <p className="text-[11px] font-medium text-[#657894] truncate">
                    {currentUser.email}
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-[#eaf2fc] text-[11px] text-[#657894] flex items-center justify-between">
                <span className="font-semibold text-[#10233f]">
                  {currentUser.position}
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#eff6ff] text-blue-700">
                  {isAdmin ? 'Admin' : (currentUser as any).deptShort}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
