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
    <header className="h-[68px] px-4 sm:px-7 bg-white/95 backdrop-blur border-b border-[#e7e7e4] flex items-center justify-between sticky top-0 z-30">
      {/* Left zone: Mobile toggle + Breadcrumb Title */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-1.5 rounded-lg text-[#737373] hover:text-[#171717] hover:bg-[#f4f4f2] transition-colors"
          aria-label="Open navigation"
        >
          <Menu className="w-4 h-4" />
        </button>

        <h1 className="max-w-[46vw] truncate text-[17px] font-bold tracking-[-0.01em] text-[#171717] sm:text-xl lg:max-w-none">{title}</h1>
      </div>

      {/* Center zone: quick search */}
      <div className="relative mx-4 hidden max-w-xl flex-1 md:block lg:mx-8">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#737373]" />
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
          className="w-full rounded-xl bg-[#f0f0ee] py-2.5 pl-11 pr-4 text-sm text-[#171717] placeholder:text-[#8a8a8a] transition focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#171717]/10"
        />
        {searchFocused && q && (
          <div className="absolute left-0 right-0 top-12 z-50 overflow-hidden rounded-xl border border-[#e7e7e4] bg-white p-1.5 shadow-[0_18px_45px_rgba(0,0,0,0.12)]">
            {searchResults.length === 0 ? (
              <p className="px-3 py-4 text-center text-xs text-[#737373]">No matches for “{query}”</p>
            ) : (
              searchResults.map((r) => (
                <button
                  key={r.key}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    onNavigate?.(r.tab);
                    setQuery('');
                  }}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm hover:bg-[#f4f4f2]"
                >
                  <span className="font-medium text-[#171717]">{r.label}</span>
                  <span className="text-[11px] text-[#8a8a8a]">{r.hint}</span>
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
              className={`relative flex h-9 w-9 items-center justify-center rounded-xl border transition ${showNotifications ? 'border-[#c9dccf] bg-[#eef6f0] text-[#2f5d50]' : 'border-[#e7e7e4] bg-white text-[#737373] hover:border-[#c9dccf] hover:bg-[#f4f4f2]'}`}
              aria-label={`${pendingLeaves.length} pending leave requests`}
            >
              <Bell className="h-4 w-4" />
              {pendingLeaves.length > 0 && <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-white bg-[#e5484d] px-1 text-[9px] font-extrabold text-white shadow-sm">{pendingLeaves.length}</span>}
            </button>
            {showNotifications && <div className="absolute right-0 top-12 z-50 w-[min(320px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-[#e5e5e2] bg-white shadow-[0_18px_45px_rgba(0,0,0,0.16)]">
              <div className="flex items-center justify-between border-b border-[#f0f0ee] px-4 py-3"><div><p className="text-xs font-extrabold text-[#171717]">Pending requests</p><p className="mt-0.5 text-[10px] text-[#737373]">Needs an admin decision</p></div><span className="rounded-full bg-[#fff6df] px-2 py-1 text-[10px] font-bold text-[#a66c00]">{pendingLeaves.length} open</span></div>
              <div className="max-h-72 overflow-y-auto p-2">{pendingLeaves.length === 0 ? <div className="px-3 py-8 text-center text-xs text-[#737373]">You&apos;re all caught up.</div> : pendingLeaves.slice(0, 4).map((request) => <div key={request.id} className="rounded-xl px-3 py-3 transition hover:bg-[#f7f7f5]"><div className="flex items-start gap-2"><span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#f59e0b]" /><div className="min-w-0 flex-1"><p className="truncate text-xs font-extrabold text-[#171717]">{request.facultyName}</p><p className="mt-0.5 truncate text-[10px] text-[#737373]">{request.department} · {request.daysCount} days</p><p className="mt-1 line-clamp-2 text-[10px] leading-4 text-[#737373]">{request.reason}</p><div className="mt-2 flex items-center gap-1.5"><button onClick={() => updateLeaveRequestStatus(request.id, 'Approved')} className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2 py-1 text-[10px] font-bold text-white"><CheckCircle2 className="h-3 w-3" /> Approve</button><button onClick={() => updateLeaveRequestStatus(request.id, 'Rejected')} className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2 py-1 text-[10px] font-bold text-red-600"><XCircle className="h-3 w-3" /> Reject</button></div></div></div></div>)}</div>
              <button onClick={() => { setShowNotifications(false); onOpenLeaveRequests?.(); }} className="flex w-full items-center justify-center gap-1 border-t border-[#f0f0ee] bg-[#f7f7f5] px-4 py-3 text-[11px] font-bold text-[#2f5d50] hover:bg-[#eef6f0]">Open leave management <span>→</span></button>
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
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#e7e7e4] bg-[#f7f7f5] text-[11px] font-semibold text-[#404040] select-none">
          <Clock
            className="w-3 h-3 shrink-0"
            style={{ color: currentTheme.primaryHex }}
          />
          <span className="font-semibold text-[#171717]">
            {clock.dayName}
          </span>
          <span className="text-[#d4d4d4] font-light">·</span>
          <span className="font-mono tabular-nums font-bold text-[#171717]">
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
              className="flex h-9 w-9 items-center justify-center rounded-lg text-xs font-bold text-white shadow-xs"
              style={{
                background: `linear-gradient(135deg, ${currentTheme.primaryHex}, ${currentTheme.deepHex})`,
              }}
            >
              {currentUser.avatarInitials}
            </div>
            <div className="hidden leading-tight xl:block">
              <p className="text-sm font-semibold text-[#171717]">{currentUser.name.split(' ').slice(0, 2).join(' ')}</p>
              <p className="text-[12px] text-[#737373]">{isAdmin ? 'Admin' : (currentUser as any).deptShort + ' Faculty'}</p>
            </div>
            <ChevronDown className="hidden h-4 w-4 text-[#404040] xl:block" />
          </div>

          {/* Popover / Tooltip */}
          {showProfilePopover && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl border border-[#e7e7e4] shadow-xl p-3 z-50 pointer-events-none transition-all duration-150">
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
                  <p className="text-xs font-bold text-[#171717] truncate">
                    {currentUser.name}
                  </p>
                  <p className="text-[11px] font-medium text-[#737373] truncate">
                    {currentUser.email}
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-[#efefed] text-[11px] text-[#737373] flex items-center justify-between">
                <span className="font-semibold text-[#171717]">
                  {currentUser.position}
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#eef6f0] text-green-700">
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
