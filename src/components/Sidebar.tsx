import React from 'react';
import { useApp } from '../context/AppContext';
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  CalendarDays,
  Settings,
  Clock,
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
  const { currentUser, currentTheme, leaveRequests } = useApp();

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
        className={`group relative flex w-full cursor-pointer items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all ${
          isActive ? 'font-bold text-[#10233f] shadow-xs' : 'text-[#657894] hover:bg-[#f6faff] hover:text-[#10233f]'
        }`}
        style={{ backgroundColor: isActive ? currentTheme.lightHex : undefined }}
      >
        {isActive && (
          <span className="absolute bottom-1.5 left-0 top-1.5 w-1 rounded-r-full" style={{ backgroundColor: currentTheme.primaryHex }} />
        )}
        <Icon
          className={`h-4 w-4 shrink-0 transition-colors ${isActive ? '' : 'text-[#8494aa] group-hover:text-[#10233f]'}`}
          style={{ color: isActive ? currentTheme.primaryHex : undefined }}
        />
        <span className="truncate">{item.label}</span>
        {item.badge ? (
          <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full border border-amber-200 bg-amber-50 px-1.5 text-[10px] font-bold text-amber-700">
            {item.badge}
          </span>
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
        className={`fixed top-0 bottom-0 left-0 z-40 flex w-[245px] flex-col justify-between border-r border-[#dce8f7] bg-white transition-transform duration-300 ease-in-out ${
          isOpenMobile ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex min-h-0 flex-col">
          {/* Brand block */}
          <div className="flex h-18 items-center border-b border-[#eaf2fc] px-5">
            <div>
              <div className="flex items-center gap-2">
                <div
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-sm font-black text-white shadow-xs"
                  style={{ background: `linear-gradient(135deg, ${currentTheme.primaryHex}, ${currentTheme.deepHex})` }}
                >
                  A
                </div>
                <span className="text-lg font-black tracking-wider" style={{ color: currentTheme.deepHex }}>
                  AJU BOT
                </span>
              </div>
              <p className="ml-9 mt-0.5 text-[10px] font-bold uppercase tracking-wider text-[#657894]">
                {isAdmin ? 'Admin workspace' : 'Faculty workspace'}
              </p>
            </div>
          </div>

          <nav className="flex-1 space-y-4 overflow-y-auto p-3">
            <div>
              <p className="mb-1.5 px-3.5 text-[10px] font-bold uppercase tracking-wider text-[#8494aa]">Main Menu</p>
              <div className="space-y-1">{mainMenu.map(renderItem)}</div>
            </div>
            <div>
              <p className="mb-1.5 px-3.5 text-[10px] font-bold uppercase tracking-wider text-[#8494aa]">Support</p>
              <div className="space-y-1">{supportMenu.map(renderItem)}</div>
            </div>
          </nav>
        </div>

        {/* Bottom-Fixed Identity Block (Always visible, outside scroll) */}
        <div className="p-4 border-t border-[#eaf2fc] bg-white">
          <div className="flex items-center gap-3">
            {/* Circular avatar with user's initials */}
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shrink-0 shadow-xs text-white"
              style={{
                background: `linear-gradient(135deg, ${currentTheme.primaryHex}, ${currentTheme.deepHex})`,
              }}
            >
              {currentUser.avatarInitials}
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-[#10233f] truncate leading-tight">
                {currentUser.name}
              </p>
              <p className="text-[11px] font-medium text-[#657894] truncate mt-0.5">
                {isAdmin
                  ? 'Admin'
                  : `Faculty — ${(currentUser as any).deptShort || 'Academic'}`}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
