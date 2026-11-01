import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  supabase,
  FacultyRow,
  LeaveRow,
  facultyToRow,
  rowToFaculty,
  leaveToRow,
  rowToLeave,
  subscribeToChanges,
} from '../lib/supabase';
import {
  CurrentUser,
  FacultyMember,
  LeaveRequest,
  AcademicHoliday,
  ThemeConfig,
  FacultyStatusDetail,
  FacultyLiveStatus,
  ClassPeriod,
  FacultyPresence,
  ClassSession,
  CourseFeedback,
} from '../types';
import {
  ADMIN_USER,
  INITIAL_FACULTY,
  INITIAL_LEAVE_REQUESTS,
  ACADEMIC_HOLIDAYS,
  THEME_PALETTES,
  FACULTY_PRESENCE,
  CLASS_SESSIONS,
  COURSE_FEEDBACK,
} from '../data/mockData';

interface SimulatedClock {
  isSimulated: boolean;
  dateStr: string;   // YYYY-MM-DD
  dayName: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  timeStr: string;   // HH:MM
}

interface AppContextType {
  currentUser: CurrentUser | null;
  setCurrentUser: (user: CurrentUser | null) => void;
  facultyList: FacultyMember[];
  leaveRequests: LeaveRequest[];
  holidays: AcademicHoliday[];
  presence: FacultyPresence[];
  sessions: ClassSession[];
  feedback: CourseFeedback[];
  getFacultyPresence: (facultyId: string, date?: string) => FacultyPresence | undefined;
  currentTheme: ThemeConfig;
  setTheme: (themeId: string) => void;
  clock: SimulatedClock;
  setSimulatedClock: (clock: Partial<SimulatedClock>) => void;
  resetClockToRealtime: () => void;
  getFacultyLiveStatus: (facultyId: string) => FacultyStatusDetail;
  getFreeFacultyForSlot: (
    day: string,
    startTime: string,
    endTime: string,
    date: string,
    excludeFacultyId: string
  ) => FacultyMember[];
  toggleModuleCompletion: (
    facultyId: string,
    subjectId: string,
    moduleId: string
  ) => void;
  addSubjectModule: (
    facultyId: string,
    subjectId: string,
    moduleName: string
  ) => void;
  submitLeaveRequest: (
    req: Omit<LeaveRequest, 'id' | 'createdAt' | 'status'>
  ) => void;
  addFaculty: (
    faculty: Omit<FacultyMember, 'id' | 'role' | 'avatarInitials' | 'timetable' | 'subjects'>
  ) => FacultyMember;
  updateLeaveRequestStatus: (
    requestId: string,
    status: 'Approved' | 'Rejected'
  ) => void;
  logout: () => void;
  loginUser: (user: CurrentUser) => void;
  /** 'supabase' once live data has loaded, 'local' when running on the bundled DB snapshot */
  dataSource: 'loading' | 'supabase' | 'local';
  syncError: string | null;
  clearSyncError: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Bumped when the seed data changes shape (v2 = data exported from db/aju_bot.db),
// so stale browser copies of the old demo data are discarded.
const STORAGE = {
  faculty: 'aju_v2_faculty_list',
  leave: 'aju_v2_leave_requests',
  user: 'aju_v2_current_user',
};
['aju_faculty_list', 'aju_leave_requests', 'aju_current_user'].forEach((k) => {
  try {
    localStorage.removeItem(k);
  } catch {
    // ignore
  }
});

const DAYS_OF_WEEK: ('Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday')[] = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load faculty list from localStorage or fallback
  const [facultyList, setFacultyList] = useState<FacultyMember[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE.faculty);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return INITIAL_FACULTY;
  });

  // Load leave requests
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE.leave);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return INITIAL_LEAVE_REQUESTS;
  });

  const [holidays] = useState<AcademicHoliday[]>(ACADEMIC_HOLIDAYS);

  // Current logged in user
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE.user);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return null;
  });

  // AJU BOT is intentionally standardized to one light institutional theme.
  // Keep the context value for existing components, but do not expose a user theme switcher.
  const currentTheme = THEME_PALETTES[0];

  // Apply the fixed light theme variables once the provider mounts.
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--accent', currentTheme.primaryHex);
    root.style.setProperty('--accent-deep', currentTheme.deepHex);
    root.style.setProperty('--accent-light', currentTheme.lightHex);
    root.style.setProperty('--accent-border', currentTheme.borderHex);
    root.style.setProperty('--accent-glow', currentTheme.glowHex);

  }, [currentTheme]);

  // ---------- Supabase sync ----------
  // On mount, replace the local copy with the database rows. After that, every
  // faculty or leave row whose content changed is upserted back. `synced` holds
  // the last saved JSON per row id, so unchanged rows are never re-sent.
  // Realtime events from other users reload the table and refresh `synced`, so
  // incoming rows are not echoed back as writes.
  const [remoteReady, setRemoteReady] = useState(false);
  const [dataSource, setDataSource] = useState<'loading' | 'supabase' | 'local'>(supabase ? 'loading' : 'local');
  const [syncError, setSyncError] = useState<string | null>(null);
  const synced = useRef<{ faculty: Map<string, string>; leave: Map<string, string> } | null>(null);

  useEffect(() => {
    const db = supabase;
    if (!db) return;
    let cancelled = false;

    const fetchFaculty = () =>
      db.from('faculty').select('*').order('employee_code', { nullsFirst: false }).order('created_at');
    const fetchLeave = () => db.from('leave_requests').select('*').order('created_at', { ascending: false });

    (async () => {
      const [f, l] = await Promise.all([fetchFaculty(), fetchLeave()]);
      if (cancelled) return;
      if (f.error || l.error) {
        const message = (f.error ?? l.error)?.message;
        console.error('Supabase load failed, using local data:', message);
        setSyncError(`Couldn't load from Supabase, showing offline data: ${message}`);
        setDataSource('local');
        return;
      }
      if (f.data.length === 0) {
        console.warn('Supabase faculty table is empty, using local data. Run `npm run db:seed`.');
        setDataSource('local');
        return;
      }
      const faculty = (f.data as FacultyRow[]).map(rowToFaculty);
      const leave = (l.data as LeaveRow[]).map(rowToLeave);
      synced.current = {
        faculty: new Map(faculty.map((x) => [x.id, JSON.stringify(x)])),
        leave: new Map(leave.map((x) => [x.id, JSON.stringify(x)])),
      };
      // Rows created in this browser while it was offline (timestamp ids) are kept and,
      // being absent from `synced`, get uploaded by the save effects below.
      const createdOffline = <T extends { id: string }>(local: T[], remote: T[]) =>
        local.filter((x) => /-\d{13}$/.test(x.id) && !remote.some((r) => r.id === x.id));
      setFacultyList((local) => [...faculty, ...createdOffline(local, faculty)]);
      setLeaveRequests((local) => [...createdOffline(local, leave), ...leave]);
      setRemoteReady(true);
      setDataSource('supabase');
    })();

    const unsubscribe = subscribeToChanges(async (table) => {
      if (!synced.current) return;
      if (table === 'faculty') {
        const { data, error } = await fetchFaculty();
        if (cancelled || error || !data?.length) return;
        const faculty = (data as FacultyRow[]).map(rowToFaculty);
        faculty.forEach((x) => synced.current?.faculty.set(x.id, JSON.stringify(x)));
        setFacultyList(faculty);
      } else {
        const { data, error } = await fetchLeave();
        if (cancelled || error || !data) return;
        const leave = (data as LeaveRow[]).map(rowToLeave);
        leave.forEach((x) => synced.current?.leave.set(x.id, JSON.stringify(x)));
        setLeaveRequests(leave);
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!remoteReady || !supabase || !synced.current) return;
    const saved = synced.current.faculty;
    const changed = facultyList.filter((x) => saved.get(x.id) !== JSON.stringify(x));
    if (changed.length === 0) return;
    changed.forEach((x) => saved.set(x.id, JSON.stringify(x)));
    supabase
      .from('faculty')
      .upsert(changed.map(facultyToRow))
      .then(({ error }) => {
        if (!error) return;
        console.error('Supabase faculty save failed:', error.message);
        setSyncError(`Couldn't save faculty changes to Supabase: ${error.message}`);
        changed.forEach((x) => saved.delete(x.id)); // retry on the next change
      });
  }, [facultyList, remoteReady]);

  useEffect(() => {
    if (!remoteReady || !supabase || !synced.current) return;
    const saved = synced.current.leave;
    const changed = leaveRequests.filter((x) => saved.get(x.id) !== JSON.stringify(x));
    if (changed.length === 0) return;
    changed.forEach((x) => saved.set(x.id, JSON.stringify(x)));
    supabase
      .from('leave_requests')
      .upsert(changed.map(leaveToRow))
      .then(({ error }) => {
        if (!error) return;
        console.error('Supabase leave save failed:', error.message);
        setSyncError(`Couldn't save leave changes to Supabase: ${error.message}`);
        changed.forEach((x) => saved.delete(x.id));
      });
  }, [leaveRequests, remoteReady]);

  // Save faculty list and keep currentUser updated if faculty
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE.faculty, JSON.stringify(facultyList));
    } catch {
      // ignore
    }
    if (currentUser && currentUser.role === 'faculty') {
      const live = facultyList.find((f) => f.id === currentUser.id);
      if (live && JSON.stringify(live.subjects) !== JSON.stringify(currentUser.subjects)) {
        setCurrentUser(live);
      }
    }
  }, [facultyList, currentUser]);

  // Save leave requests
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE.leave, JSON.stringify(leaveRequests));
    } catch {
      // ignore
    }
  }, [leaveRequests]);

  // Save current user
  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem(STORAGE.user, JSON.stringify(currentUser));
      } else {
        localStorage.removeItem(STORAGE.user);
      }
    } catch {
      // ignore
    }
  }, [currentUser]);

  // Clock state (runs live with correct, recent real time and day)
  const getNowClock = (): SimulatedClock => {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    const dayName = DAYS_OF_WEEK[now.getDay()];
    const timeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
    return {
      isSimulated: false,
      dateStr,
      dayName,
      timeStr,
    };
  };

  const [clock, setClock] = useState<SimulatedClock>(getNowClock);

  // Interval for live realtime updates every second
  useEffect(() => {
    const interval = setInterval(() => {
      setClock(getNowClock());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const setSimulatedClock = (newPartial: Partial<SimulatedClock>) => {
    setClock((prev) => ({
      ...prev,
      ...newPartial,
      isSimulated: true,
    }));
  };

  const resetClockToRealtime = () => {
    setClock(getNowClock());
  };

  // Kept as a no-op for compatibility with older view components.
  const setTheme = (_id: string) => undefined;

  // Convert HH:MM to total minutes from midnight for interval math
  const timeToMinutes = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };

  // Campus presence record for a faculty on a date (defaults to the clock's date)
  const getFacultyPresence = (facultyId: string, date: string = clock.dateStr) =>
    FACULTY_PRESENCE.find((p) => p.facultyId === facultyId && p.date === date);

  // Live status calculation for any faculty
  const getFacultyLiveStatus = (facultyId: string): FacultyStatusDetail => {
    const faculty = facultyList.find((f) => f.id === facultyId);
    if (!faculty) return { status: 'Free' };

    // 1. Check if faculty has an Approved Leave covering today's clock date
    const currentDate = clock.dateStr;
    const activeLeave = leaveRequests.find((l) => {
      if (l.facultyId !== facultyId || l.status !== 'Approved') return false;
      return currentDate >= l.fromDate && currentDate <= l.toDate;
    });

    if (activeLeave) {
      return { status: 'On Leave', activeLeave };
    }
    if (getFacultyPresence(facultyId)?.status === 'On Leave') {
      return { status: 'On Leave' };
    }

    // 2. Check if day is Sunday (Institutional off)
    if (clock.dayName === 'Sunday') {
      return { status: 'Free' };
    }

    // 3. Check timetable for current day and time
    const currentMins = timeToMinutes(clock.timeStr);
    const dayClasses = faculty.timetable.filter((c) => c.day === clock.dayName);

    const activeClass = dayClasses.find((c) => {
      const startMins = timeToMinutes(c.startTime);
      const endMins = timeToMinutes(c.endTime);
      return currentMins >= startMins && currentMins < endMins;
    });

    if (activeClass) {
      return { status: 'In Class', currentClass: activeClass };
    }

    return { status: 'Free' };
  };

  // Find other faculty who are free at a specific slot and date
  const getFreeFacultyForSlot = (
    day: string,
    startTime: string,
    endTime: string,
    date: string,
    excludeFacultyId: string
  ): FacultyMember[] => {
    const startMins = timeToMinutes(startTime);
    const endMins = timeToMinutes(endTime);

    return facultyList.filter((faculty) => {
      if (faculty.id === excludeFacultyId) return false;

      // Check if this faculty is on approved leave on that date
      const onLeave = leaveRequests.some((l) => {
        return (
          l.facultyId === faculty.id &&
          l.status === 'Approved' &&
          date >= l.fromDate &&
          date <= l.toDate
        );
      });
      if (onLeave) return false;

      // Check if teaching during that slot
      const hasConflict = faculty.timetable.some((c) => {
        if (c.day !== day) return false;
        const cStart = timeToMinutes(c.startTime);
        const cEnd = timeToMinutes(c.endTime);
        // Overlap condition: start < otherEnd and end > otherStart
        return startMins < cEnd && endMins > cStart;
      });

      return !hasConflict;
    });
  };

  // Apply a change to one faculty's subjects (the Supabase sync effect saves it)
  const updateSubjects = (facultyId: string, change: (subjects: FacultyMember['subjects']) => FacultyMember['subjects']) => {
    const target = facultyList.find((f) => f.id === facultyId);
    if (!target) return;
    const subjects = change(target.subjects);
    setFacultyList((prev) => prev.map((f) => (f.id === facultyId ? { ...f, subjects } : f)));
  };

  // Toggle module completion (Faculty Dashboard only)
  const toggleModuleCompletion = (
    facultyId: string,
    subjectId: string,
    moduleId: string
  ) => {
    updateSubjects(facultyId, (subjects) =>
      subjects.map((sub) => {
        if (sub.id !== subjectId) return sub;
        return {
          ...sub,
          modules: sub.modules.map((mod) => {
            if (mod.id !== moduleId) return mod;
            const completed = !mod.completed;
            return {
              ...mod,
              completed,
              status: completed ? 'completed' : 'not_started',
              completionPct: completed ? 100 : 0,
              updatedOn: clock.dateStr,
            };
          }),
        };
      })
    );
  };

  // Add module to a subject (Hard cap of 5 modules per subject)
  const addSubjectModule = (
    facultyId: string,
    subjectId: string,
    moduleName: string
  ) => {
    if (!moduleName.trim()) return;
    updateSubjects(facultyId, (subjects) =>
      subjects.map((sub) => {
        if (sub.id !== subjectId) return sub;
        // HARD CAP OF 5: No more than 5 modules can ever be added
        if (sub.modules.length >= 5) return sub;
        const newMod = {
          id: `m_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          name: moduleName.trim(),
          completed: false,
          status: 'not_started' as const,
          completionPct: 0,
        };
        return {
          ...sub,
          modules: [...sub.modules, newMod],
        };
      })
    );
  };

  // Submit new leave request
  const submitLeaveRequest = (
    req: Omit<LeaveRequest, 'id' | 'createdAt' | 'status'>
  ) => {
    const newRequest: LeaveRequest = {
      ...req,
      id: `leave-${Date.now()}`,
      status: 'Pending',
      createdAt: `${clock.dateStr} ${clock.timeStr}`,
    };
    setLeaveRequests((prev) => [newRequest, ...prev]);
  };

  // Register a newly joined faculty member (no timetable or subjects yet)
  const addFaculty = (
    data: Omit<FacultyMember, 'id' | 'role' | 'avatarInitials' | 'timetable' | 'subjects'>
  ) => {
    const initials = data.name
      .trim()
      .split(/\s+/)
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
    const faculty: FacultyMember = {
      ...data,
      id: `fac-${Date.now()}`,
      role: 'faculty',
      avatarInitials: initials,
      timetable: [],
      subjects: [],
    };
    setFacultyList((prev) => [...prev, faculty]);
    return faculty;
  };

  // Approve / Reject leave
  const updateLeaveRequestStatus = (
    requestId: string,
    status: 'Approved' | 'Rejected'
  ) => {
    // Leave and its substitution requests are reviewed together
    const reviewedAt = `${clock.dateStr} ${clock.timeStr}`;
    const target = leaveRequests.find((r) => r.id === requestId);
    if (!target) return;
    const updated: LeaveRequest = { ...target, status, reviewedAt, substitutions: target.substitutions.map((sub) => ({ ...sub, status })) };
    setLeaveRequests((prev) => prev.map((r) => (r.id === requestId ? updated : r)));
  };

  const loginUser = (user: CurrentUser) => {
    setCurrentUser(user);
  };

  const logout = () => {
    setCurrentUser(null);
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        facultyList,
        leaveRequests,
        holidays,
        presence: FACULTY_PRESENCE,
        sessions: CLASS_SESSIONS,
        feedback: COURSE_FEEDBACK,
        getFacultyPresence,
        currentTheme,
        setTheme,
        clock,
        setSimulatedClock,
        resetClockToRealtime,
        getFacultyLiveStatus,
        getFreeFacultyForSlot,
        toggleModuleCompletion,
        addSubjectModule,
        submitLeaveRequest,
        addFaculty,
        updateLeaveRequestStatus,
        logout,
        loginUser,
        dataSource,
        syncError,
        clearSyncError: () => setSyncError(null),
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
