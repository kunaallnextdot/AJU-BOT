/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Splash } from './components/Splash';
import { Login } from './components/Login';
import { Sidebar, AdminViewTab, FacultyViewTab } from './components/Sidebar';
import { TopNav } from './components/TopNav';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { AdminFaculty } from './components/admin/AdminFaculty';
import { AdminLeave } from './components/admin/AdminLeave';
import { FacultyDrawer } from './components/admin/FacultyDrawer';
import { AcademicCalendar } from './components/common/AcademicCalendar';
import { SettingsTheme } from './components/common/SettingsTheme';
import { FacultyMyDay } from './components/faculty/FacultyMyDay';
import { FacultyDashboard } from './components/faculty/FacultyDashboard';
import { FacultyTimetable } from './components/faculty/FacultyTimetable';
import { FacultyTeams } from './components/faculty/FacultyTeams';
import { FacultyLeave } from './components/faculty/FacultyLeave';
import { FacultyMember } from './types';

const MainAppContent: React.FC = () => {
  const { currentUser, facultyList } = useApp();
  const [showSplash, setShowSplash] = useState(true);
  const [adminTab, setAdminTab] = useState<AdminViewTab>('dashboard');
  const [facultyTab, setFacultyTab] = useState<FacultyViewTab>('my-day');
  const [adminFacultyFilter, setAdminFacultyFilter] = useState<string>('all');
  const [selectedFacultyForDrawer, setSelectedFacultyForDrawer] = useState<FacultyMember | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // 1. Show Splash Screen if active
  if (showSplash) {
    return <Splash onComplete={() => setShowSplash(false)} />;
  }

  // 2. Show Login Screen if no user logged in
  if (!currentUser) {
    return <Login onReplaySplash={() => setShowSplash(true)} />;
  }

  const isAdmin = currentUser.role === 'admin';

  // Navigation callbacks
  const handleAdminNavigate = (tab: string, filter?: string) => {
    if (filter) {
      setAdminFacultyFilter(filter);
    }
    setAdminTab(tab as AdminViewTab);
  };

  const handleOpenFacultyDrawer = (facultyId: string) => {
    const fac = facultyList.find((f) => f.id === facultyId);
    if (fac) {
      setSelectedFacultyForDrawer(fac);
    }
  };

  // Get current view title for TopNav
  const getHeaderTitle = () => {
    if (isAdmin) {
      switch (adminTab) {
        case 'dashboard':
          return 'Academic Operations Dashboard';
        case 'faculty':
          return 'Faculty Team Directory';
        case 'leave':
          return 'Leave & Substitution Management';
        case 'calendar':
          return 'Academic Holiday Calendar';
        case 'settings':
          return 'Workspace Settings';
      }
    } else {
      switch (facultyTab) {
        case 'my-day':
          return 'My Day Schedule';
        case 'dashboard':
          return 'Course Syllabus & Modules';
        case 'timetable':
          return 'Master Teaching Timetable';
        case 'faculty':
          return 'Faculty Colleagues';
        case 'leave':
          return 'Leave & Peer Substitution';
        case 'calendar':
          return 'Academic Calendar';
        case 'settings':
          return 'Workspace Settings';
      }
    }
    return 'AJU BOT Workspace';
  };

  return (
    <div className="min-h-screen bg-[#f4f4f2] text-[#171717] flex flex-col selection:bg-green-100 selection:text-green-900">
      {/* Persistent role-based navigation */}
      <Sidebar
        currentTab={isAdmin ? adminTab : facultyTab}
        onSelectTab={(tab) => {
          if (isAdmin) {
            setAdminTab(tab as AdminViewTab);
          } else {
            setFacultyTab(tab as FacultyViewTab);
          }
        }}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main content viewport */}
      <div className="lg:pl-[245px] flex-1 flex flex-col min-w-0">
        {/* Utility header with current page context and live clock */}
        <TopNav
          title={getHeaderTitle()}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          onNavigate={(tab) => {
            if (isAdmin) {
              setAdminTab(tab as AdminViewTab);
            } else {
              setFacultyTab(tab as FacultyViewTab);
            }
          }}
          onOpenLeaveRequests={() => {
            if (isAdmin) {
              setAdminTab('leave');
            } else {
              setFacultyTab('leave');
            }
          }}
        />

        {/* Main workspace body */}
        <main className="p-4 sm:p-5 lg:p-7 max-w-[1440px] w-full mx-auto flex-1">
          {isAdmin ? (
            /* Admin Workspace Views */
            <>
              {adminTab === 'dashboard' && (
                <AdminDashboard
                  onNavigateTab={handleAdminNavigate}
                  onOpenFacultyDrawer={handleOpenFacultyDrawer}
                />
              )}
              {adminTab === 'faculty' && (
                <AdminFaculty
                  initialFilter={adminFacultyFilter}
                  selectedFacultyId={selectedFacultyForDrawer?.id}
                  onClearSelectedFaculty={() => setSelectedFacultyForDrawer(null)}
                />
              )}
              {adminTab === 'leave' && <AdminLeave />}
              {adminTab === 'calendar' && <AcademicCalendar />}
              {adminTab === 'settings' && <SettingsTheme />}
            </>
          ) : (
            /* Faculty Workspace Views */
            <>
              {facultyTab === 'my-day' && (
                <FacultyMyDay
                  faculty={currentUser as FacultyMember}
                  onNavigateTab={(tab) => setFacultyTab(tab as FacultyViewTab)}
                />
              )}
              {facultyTab === 'dashboard' && (
                <FacultyDashboard faculty={currentUser as FacultyMember} />
              )}
              {facultyTab === 'timetable' && (
                <FacultyTimetable faculty={currentUser as FacultyMember} />
              )}
              {facultyTab === 'faculty' && <FacultyTeams />}
              {facultyTab === 'leave' && (
                <FacultyLeave faculty={currentUser as FacultyMember} />
              )}
              {facultyTab === 'calendar' && <AcademicCalendar />}
              {facultyTab === 'settings' && <SettingsTheme />}
            </>
          )}

          {/* Standalone Faculty Drawer when invoked from Admin Dashboard */}
          {selectedFacultyForDrawer && adminTab === 'dashboard' && (
            <FacultyDrawer
              faculty={selectedFacultyForDrawer}
              onClose={() => setSelectedFacultyForDrawer(null)}
              isReadOnly={true}
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainAppContent />
    </AppProvider>
  );
}
