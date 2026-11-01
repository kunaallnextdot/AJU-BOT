import React, { useMemo, useState } from 'react';
import { UserPlus, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { toDateStr } from '../../lib/leaveRules';
import { FacultyMember } from '../../types';

interface AddFacultyModalProps {
  onClose: () => void;
  onAdded: (faculty: FacultyMember, offline: boolean) => void;
}

const POSITIONS = ['Professor', 'Associate Professor', 'Assistant Professor'];
const NEW_DEPARTMENT = '__new__';

const INPUT_CLASS =
  'w-full rounded-xl border border-[#dce8f7] bg-[#f8fbff] px-3 py-2 text-xs font-medium text-[#10233f] placeholder:text-[#94a3b8] transition focus:border-blue-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100';
const LABEL_CLASS = 'mb-1 block text-[10px] font-bold uppercase tracking-wider text-[#657894]';

export const AddFacultyModal: React.FC<AddFacultyModalProps> = ({ onClose, onAdded }) => {
  const { facultyList, addFaculty, currentTheme } = useApp();

  // Departments already in use, with their short codes, for the dropdown
  const departments = useMemo(() => {
    const map = new Map<string, string>();
    facultyList.forEach((f) => map.set(f.department, f.deptShort));
    return Array.from(map, ([name, short]) => ({ name, short }));
  }, [facultyList]);

  // Next free employee code in the AJU-F### sequence
  const nextEmployeeCode = useMemo(() => {
    const max = facultyList.reduce((n, f) => {
      const m = f.employeeCode?.match(/^AJU-F(\d+)$/);
      return m ? Math.max(n, Number(m[1])) : n;
    }, 0);
    return `AJU-F${String(max + 1).padStart(3, '0')}`;
  }, [facultyList]);

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    position: POSITIONS[2],
    department: departments[0]?.name ?? NEW_DEPARTMENT,
    newDepartment: '',
    newDeptShort: '',
    employeeCode: nextEmployeeCode,
    cabin: '',
    joinedOn: toDateStr(new Date()),
    currentSection: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
    if (error) setError(null);
  };

  const isNewDept = form.department === NEW_DEPARTMENT;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    const name = form.name.trim();
    const email = form.email.trim().toLowerCase();
    const employeeCode = form.employeeCode.trim().toUpperCase();
    const department = isNewDept ? form.newDepartment.trim() : form.department;
    const deptShort = isNewDept
      ? form.newDeptShort.trim().toUpperCase()
      : departments.find((d) => d.name === form.department)?.short ?? '';

    if (!name || !email || !department || !deptShort) {
      setError('Please fill in name, email and department.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (facultyList.some((f) => f.email.toLowerCase() === email)) {
      setError('A faculty member with this email already exists.');
      return;
    }
    if (employeeCode && facultyList.some((f) => f.employeeCode?.toUpperCase() === employeeCode)) {
      setError(`Employee code ${employeeCode} is already taken.`);
      return;
    }

    setSaving(true);
    const result = await addFaculty({
      name,
      email,
      phone: form.phone.trim() || null,
      position: form.position,
      designation: form.position,
      department,
      deptShort,
      employeeCode: employeeCode || undefined,
      cabin: form.cabin.trim().toUpperCase() || null,
      joinedOn: form.joinedOn || null,
      currentSection: form.currentSection.trim() || 'Not assigned',
    });
    setSaving(false);
    if (!result.ok) {
      setError(`Couldn't add faculty: ${result.error}`);
      return;
    }
    onAdded(result.value, result.offline);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#10233f]/40 backdrop-blur-xs" onClick={onClose} />
      <form
        onSubmit={handleSubmit}
        className="relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-[#dce8f7] bg-white shadow-[0_16px_36px_rgba(31,76,126,0.14)] animate-in fade-in duration-200"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-[#eaf2fc] px-5 py-4">
          <div className="flex items-start gap-2.5">
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white shadow-xs"
              style={{ background: `linear-gradient(135deg, ${currentTheme.primaryHex}, ${currentTheme.deepHex})` }}
            >
              <UserPlus className="h-4 w-4" />
            </span>
            <div>
              <h3 className="text-[13px] font-bold text-[#10233f]">Add new faculty</h3>
              <p className="mt-0.5 text-[11px] text-[#657894]">They can sign in with their name or email once added.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-lg p-1.5 text-[#657894] transition hover:bg-[#f0f5fc] hover:text-[#10233f]"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Fields */}
        <div className="grid grid-cols-1 gap-3.5 overflow-y-auto px-5 py-4 sm:grid-cols-2">
          <label className="sm:col-span-2">
            <span className={LABEL_CLASS}>Full name *</span>
            <input autoFocus value={form.name} onChange={set('name')} placeholder="e.g. Anjali Sharma" className={INPUT_CLASS} />
          </label>
          <label>
            <span className={LABEL_CLASS}>Email *</span>
            <input type="email" value={form.email} onChange={set('email')} placeholder="name@aju.example" className={INPUT_CLASS} />
          </label>
          <label>
            <span className={LABEL_CLASS}>Phone</span>
            <input value={form.phone} onChange={set('phone')} placeholder="+91-90000-00000" className={INPUT_CLASS} />
          </label>
          <label>
            <span className={LABEL_CLASS}>Position *</span>
            <select value={form.position} onChange={set('position')} className={INPUT_CLASS}>
              {POSITIONS.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </label>
          <label>
            <span className={LABEL_CLASS}>Department *</span>
            <select value={form.department} onChange={set('department')} className={INPUT_CLASS}>
              {departments.map((d) => (
                <option key={d.name} value={d.name}>
                  {d.name} ({d.short})
                </option>
              ))}
              <option value={NEW_DEPARTMENT}>+ New department…</option>
            </select>
          </label>
          {isNewDept && (
            <>
              <label>
                <span className={LABEL_CLASS}>Department name *</span>
                <input value={form.newDepartment} onChange={set('newDepartment')} placeholder="e.g. Electronics & Communication" className={INPUT_CLASS} />
              </label>
              <label>
                <span className={LABEL_CLASS}>Short code *</span>
                <input value={form.newDeptShort} onChange={set('newDeptShort')} placeholder="e.g. ECE" maxLength={8} className={INPUT_CLASS} />
              </label>
            </>
          )}
          <label>
            <span className={LABEL_CLASS}>Employee code</span>
            <input value={form.employeeCode} onChange={set('employeeCode')} className={`${INPUT_CLASS} font-mono`} />
          </label>
          <label>
            <span className={LABEL_CLASS}>Cabin</span>
            <input value={form.cabin} onChange={set('cabin')} placeholder="e.g. CAB-A310" className={INPUT_CLASS} />
          </label>
          <label>
            <span className={LABEL_CLASS}>Joined on</span>
            <input type="date" value={form.joinedOn} onChange={set('joinedOn')} className={INPUT_CLASS} />
          </label>
          <label>
            <span className={LABEL_CLASS}>Section</span>
            <input value={form.currentSection} onChange={set('currentSection')} placeholder="e.g. Sem 3 CSE-B" className={INPUT_CLASS} />
          </label>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 border-t border-[#eaf2fc] bg-[#f8fbff] px-5 py-3">
          <p className="min-w-0 text-[11px] font-semibold text-red-600">{error}</p>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-lg border border-[#dce8f7] bg-white px-3.5 py-1.5 text-xs font-bold text-[#657894] transition hover:text-[#10233f]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold text-white shadow-xs transition hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
              style={{ background: `linear-gradient(135deg, ${currentTheme.primaryHex}, ${currentTheme.deepHex})` }}
            >
              <UserPlus className="h-3.5 w-3.5" /> {saving ? 'Saving…' : 'Add faculty'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
