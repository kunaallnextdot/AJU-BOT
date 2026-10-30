import React from 'react';
import { useApp } from '../context/AppContext';
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  CalendarDays,
  Settings,
  Clock,
  LogOut,
  Sparkles,
} from 'lucide-react';

export type AdminViewTab = 'dashboard' | 'faculty' | 'leave' | 'calendar' | 'settings';
export type FacultyViewTab = 'my-day' | 'dashboard' | 'timetable' | 'faculty' | 'leave' | 'calendar' | 'settings';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: any) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isOpenMobile,
  onCloseMobile,
}) => {
  const { currentUser, logout, currentTheme, leaveRequests } = useApp();

  if (!currentUser) return null;

  const isAdmin = currentUser.role === 'admin';

  // Count badges (image-2 style) so pending work is visible from anywhere
  const pendingCount = leaveRequests.filter((r) => r.status === 'Pending' && (isAdmin || r.facultyId === currentUser.id)).length;

  type NavItem = { id: string; label: string; icon: React.ElementType; badge?: number };

  const mainMenu: NavItem[] = isAdmin
    ? [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'faculty', label: 'Faculty Directory', icon: Users },
        { id: 'leave', label: 'Leave & Substitution', icon: CalendarCheck, badge: pendingCount },
        { id: 'calendar', label: 'Academic Calendar', icon: CalendarDays },
      ]
    : [
        { id: 'my-day', label: 'My Day', icon: Sparkles },
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'timetable', label: 'Timetable', icon: Clock },
        { id: 'faculty', label: 'Teams', icon: Users },
        { id: 'leave', label: 'Leave & Substitution', icon: CalendarCheck, badge: pendingCount },
        { id: 'calendar', label: 'Calendar', icon: CalendarDays },
      ];

  const supportMenu: NavItem[] = [{ id: 'settings', label: 'Settings', icon: Settings }];

  const renderItem = (item: NavItem) => {
    const Icon = item.icon;
    const isActive = currentTab === item.id;
    return (
      <button
        key={item.id}
        onClick={() => {
          onSelectTab(item.id);
          onCloseMobile();
        }}
        className={`group relative flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-[14px] transition-all ${
          isActive ? 'font-semibold text-[#171717]' : 'font-medium text-[#404040] hover:bg-[#f7f7f5] hover:text-[#171717]'
        }`}
        style={{ backgroundColor: isActive ? currentTheme.lightHex : undefined }}
      >
        <Icon className={`h-[18px] w-[18px] shrink-0 ${isActive ? 'text-[#171717]' : 'text-[#525252]'}`} />
        <span className="truncate">{item.label}</span>
        {item.badge ? (
          <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-md bg-[#171717] px-1.5 text-[11px] font-bold text-white">
            {item.badge}
          </span>
        ) : isActive ? (
          <span className="ml-auto h-2 w-2 rounded-full" style={{ backgroundColor: currentTheme.deepHex }} />
        ) : null}
      </button>
    );
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden backdrop-blur-xs transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 flex w-[245px] flex-col justify-between border-r border-[#e7e7e4] bg-white transition-transform duration-300 ease-in-out ${
          isOpenMobile ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex min-h-0 flex-col">
          {/* Brand block */}
          <div className="px-5 pb-4 pt-5">
            <div className="flex items-center gap-2.5">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-[10px] text-[15px] font-black text-white"
                style={{ background: `linear-gradient(135deg, ${currentTheme.deepHex}, #4f8a76)` }}
              >
                A
              </div>
              <span className="text-[22px] font-bold tracking-[-0.02em] text-[#171717]">AJU BOT</span>
            </div>
            <p className="mt-1.5 text-[13px] font-medium text-[#404040]">Teach. Track. Thrive.</p>
          </div>

          <nav className="flex-1 space-y-5 overflow-y-auto px-3 pb-3">
            <div>
              <p className="mb-1.5 px-3 text-[13px] font-medium text-[#8a8a8a]">Main Menu</p>
              <div className="space-y-0.5">{mainMenu.map(renderItem)}</div>
            </div>
            <div>
              <p className="mb-1.5 px-3 text-[13px] font-medium text-[#8a8a8a]">Support</p>
              <div className="space-y-0.5">{supportMenu.map(renderItem)}</div>
            </div>
          </nav>
        </div>

        {/* Bottom-Fixed Identity Block (Always visible, outside scroll) */}
        <div className="p-4 border-t border-[#f0f0ee] bg-white">
          <div className="flex items-center gap-3 mb-3">
            {/* Circular avatar with user's initials */}
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 shadow-xs text-white"
              style={{
                background: `linear-gradient(135deg, ${currentTheme.primaryHex}, ${currentTheme.deepHex})`,
              }}
            >
              {currentUser.avatarInitials}
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-[#171717] truncate leading-tight">
                {currentUser.name}
              </p>
              <p className="text-[11px] font-medium text-[#737373] truncate mt-0.5">
                {isAdmin
                  ? 'Admin'
                  : `Faculty — ${(currentUser as any).deptShort || 'Academic'}`}
              </p>
            </div>
          </div>

          {/* Logout button */}
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg border border-[#e7e7e4] bg-white hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-[#737373] text-xs font-semibold transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign out</span>
          </button>
        </div>
      </aside>
    </>
  );
};
