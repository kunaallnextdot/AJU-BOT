import { AdminUser, AcademicHoliday, ThemeConfig } from '../types';

// Matches users.id = 1 (role 'admin') in db/aju_bot.db
export const ADMIN_USER: AdminUser = {
  id: 'admin-1',
  name: 'AJU Administrator',
  role: 'admin',
  position: 'Academic Operations Admin',
  email: 'admin@aju.example',
  avatarInitials: 'AD',
};

export const THEME_PALETTES: ThemeConfig[] = [
  {
    id: 'royal-blue',
    name: 'AJU Ink & Green (Official)',
    accent: 'green',
    primaryHex: '#171717',
    deepHex: '#2f5d50',
    lightHex: '#efefed',
    borderHex: '#e2e2df',
    glowHex: 'rgba(31, 157, 85, 0.18)',
    description: 'Neutral ink surfaces with a calm green accent',
  },
  {
    id: 'ocean-teal',
    name: 'Ocean Teal',
    accent: 'teal',
    primaryHex: '#0d9488',
    deepHex: '#0f766e',
    lightHex: '#f0fdfa',
    borderHex: '#99f6e4',
    glowHex: 'rgba(13, 148, 136, 0.25)',
    description: 'Focused academic cyan and deep ocean turquoise',
  },
  {
    id: 'imperial-violet',
    name: 'Imperial Violet',
    accent: 'purple',
    primaryHex: '#7c3aed',
    deepHex: '#6d28d9',
    lightHex: '#f5f3ff',
    borderHex: '#ddd6fe',
    glowHex: 'rgba(124, 58, 237, 0.25)',
    description: 'High-contrast scholastic royal violet',
  },
  {
    id: 'forest-emerald',
    name: 'Forest Emerald',
    accent: 'green',
    primaryHex: '#059669',
    deepHex: '#047857',
    lightHex: '#ecfdf5',
    borderHex: '#a7f3d0',
    glowHex: 'rgba(5, 150, 105, 0.25)',
    description: 'Balanced botanical emerald and mint highlights',
  },
  {
    id: 'autumn-amber',
    name: 'Autumn Amber',
    accent: 'amber',
    primaryHex: '#d97706',
    deepHex: '#b45309',
    lightHex: '#fffbeb',
    borderHex: '#fde68a',
    glowHex: 'rgba(217, 119, 6, 0.25)',
    description: 'Warm parchment and burnished brass tones',
  },
  {
    id: 'crimson-rose',
    name: 'Crimson Rose',
    accent: 'rose',
    primaryHex: '#e11d48',
    deepHex: '#be123c',
    lightHex: '#fff1f2',
    borderHex: '#fecdd3',
    glowHex: 'rgba(225, 29, 72, 0.25)',
    description: 'Distinguished university maroon and velvet red',
  },
];

// Faculty, timetable, syllabus, leave, presence, sessions and feedback come from
// db/aju_bot.db (see db/export_frontend.py). Only UI-level constants live here.
export {
  INITIAL_FACULTY,
  INITIAL_LEAVE_REQUESTS,
  PERIOD_SLOTS,
  FACULTY_PRESENCE,
  CLASS_SESSIONS,
  COURSE_FEEDBACK,
} from './ajuData';

export const ACADEMIC_HOLIDAYS: AcademicHoliday[] = [
  { id: 'h-1', date: '2026-10-02', title: 'Gandhi Jayanti', type: 'festival', description: 'National Holiday' },
  { id: 'h-2', date: '2026-10-03', title: 'First Saturday Institutional Off', type: 'saturday', description: 'Alternate Non-instructional Saturday' },
  { id: 'h-3', date: '2026-10-17', title: 'Third Saturday Institutional Off', type: 'saturday', description: 'Alternate Non-instructional Saturday' },
  { id: 'h-4', date: '2026-10-20', title: 'Maha Saptami / Durga Puja', type: 'festival', description: 'Autumn Festival Vacation begins' },
  { id: 'h-5', date: '2026-10-21', title: 'Maha Ashtami / Navami', type: 'festival', description: 'Durga Puja Celebrations' },
  { id: 'h-6', date: '2026-10-22', title: 'Vijaya Dashami (Dussehra)', type: 'festival', description: 'Victory Day National Holiday' },
  { id: 'h-7', date: '2026-10-31', title: 'Sardar Vallabhbhai Patel Jayanti', type: 'observance', description: 'National Unity Day Seminar' },
  { id: 'h-8', date: '2026-11-08', title: 'Diwali (Deepavali)', type: 'festival', description: 'Festival of Lights' },
  { id: 'h-9', date: '2026-11-09', title: 'Govardhan Puja', type: 'restricted', description: 'Restricted Optional Holiday' },
  { id: 'h-10', date: '2026-11-15', title: 'Guru Nanak Jayanti', type: 'festival', description: 'Gurpurab Gazetted Holiday' },
  { id: 'h-11', date: '2026-12-25', title: 'Christmas Day', type: 'festival', description: 'Gazetted University Holiday' },
];

