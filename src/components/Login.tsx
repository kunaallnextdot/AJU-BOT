import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { AlertCircle, ArrowRight, Eye, EyeOff, KeyRound, ShieldCheck, Sparkles, User } from 'lucide-react';
import heroCampusImg from '../assets/images/campus_hero_bg_1791294918467.jpg';
import jgiLogo from '../assets/images/jgi_logo.png';
import { BRAND_DEEP, BRAND_PRIMARY } from './Splash';

const BRAND_GRADIENT = `linear-gradient(135deg, ${BRAND_PRIMARY}, ${BRAND_DEEP})`;

const INPUT_CLASS =
  'w-full rounded-xl border border-[#dce8f7] bg-[#f8fbff] py-2 pl-9 pr-3 text-xs font-medium text-[#10233f] transition-all placeholder:text-[#94a3b8] focus:border-transparent focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/60 sm:text-[13px]';

interface LoginProps {
  onReplaySplash?: () => void;
}

export const Login: React.FC<LoginProps> = ({ onReplaySplash }) => {
  const { facultyList, admins, loginUser } = useApp();
  const [roleFilter, setRoleFilter] = useState<'admin' | 'faculty'>('admin');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedQuickFill, setSelectedQuickFill] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const INSTITUTION_GATE_PASSWORD = 'aju-IT123';

  const handleRoleTabChange = (newRole: 'admin' | 'faculty') => {
    if (newRole === roleFilter) return;
    setRoleFilter(newRole);
    setFullName('');
    setPassword('');
    setSelectedQuickFill(null);
    setErrorMsg(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    const trimmedPassword = password.trim();
    const trimmedName = fullName.trim().toLowerCase();

    if (trimmedPassword !== INSTITUTION_GATE_PASSWORD) {
      setTimeout(() => {
        setErrorMsg('That access password is not valid. Please contact the AJU administrator for credentials.');
        setIsSubmitting(false);
      }, 250);
      return;
    }

    // Admin accounts come from the admins table; "admin" works when there is exactly one
    const matchedAdmin =
      admins.find((a) => a.name.toLowerCase() === trimmedName || a.email.toLowerCase() === trimmedName) ??
      (trimmedName === 'admin' && admins.length === 1 ? admins[0] : undefined);

    if (matchedAdmin) {
      setTimeout(() => {
        loginUser(matchedAdmin);
        setIsSubmitting(false);
      }, 300);
      return;
    }

    // Faculty sign in with their full name, their email, or a part of the name that matches only them
    const exact = facultyList.find((f) => f.name.toLowerCase() === trimmedName || f.email.toLowerCase() === trimmedName);
    const partial = trimmedName.length >= 4 ? facultyList.filter((f) => f.name.toLowerCase().includes(trimmedName)) : [];
    if (!exact && partial.length > 1) {
      setTimeout(() => {
        setErrorMsg(`"${fullName.trim()}" matches ${partial.length} people. Please type the full name or email.`);
        setIsSubmitting(false);
      }, 250);
      return;
    }
    const matchedFaculty = exact ?? partial[0];

    if (matchedFaculty) {
      setTimeout(() => {
        loginUser(matchedFaculty);
        setIsSubmitting(false);
      }, 300);
      return;
    }

    setTimeout(() => {
      setErrorMsg('That name is not in the faculty or administration directory.');
      setIsSubmitting(false);
    }, 250);
  };

  const handleQuickFill = (name: string) => {
    setFullName(name);
    setPassword(INSTITUTION_GATE_PASSWORD);
    setSelectedQuickFill(name);
    setErrorMsg(null);
  };

  return (
    <main className="relative flex min-h-screen w-full select-none flex-col items-center justify-center overflow-hidden bg-[#0b1a33] p-4 sm:p-6">
      <img src={heroCampusImg} alt="AJU Campus Background" className="pointer-events-none absolute inset-0 h-full w-full scale-105 object-cover object-center blur-[8px]" />
      <div className="pointer-events-none absolute inset-0 bg-black/30" />

      <div className="login-card-in relative z-10 w-full max-w-[430px] rounded-[20px] border border-white/60 bg-white/95 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.35)] backdrop-blur-md sm:p-7">
        <div className="mb-5 text-center">
          <div className="mb-1.5 inline-flex items-center justify-center gap-2">
            <img src={jgiLogo} alt="JGI logo" className="h-9 w-9 shrink-0 rounded-full shadow-sm" />
            <span className="text-2xl font-black tracking-wider" style={{ color: BRAND_DEEP }}>AJU BOT</span>
          </div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#657894]">Faculty & Academic Operations</p>
        </div>

        <div className="mb-[18px] flex rounded-xl border border-[#e2ecf9] bg-[#f0f5fc] p-1">
          {(['admin', 'faculty'] as const).map((role) => (
            <button key={role} type="button" onClick={() => handleRoleTabChange(role)} className={`flex-1 cursor-pointer rounded-lg py-1.5 text-xs font-semibold capitalize transition-all ${roleFilter === role ? 'bg-white text-[#10233f] shadow-xs' : 'text-[#657894] hover:text-[#10233f]'}`}>
              {role}
            </button>
          ))}
        </div>

        {errorMsg && (
          <div key={errorMsg} className="login-shake mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-2.5 text-xs text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
            <div className="text-[11px] font-medium leading-relaxed">{errorMsg}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[#657894]">Name or Email</label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[#657894]"><User className="h-4 w-4" /></div>
              <input type="text" required value={fullName} onChange={(e) => { setFullName(e.target.value); setSelectedQuickFill(null); if (errorMsg) setErrorMsg(null); }} placeholder={roleFilter === 'admin' ? 'e.g. admin or admin@aju.example' : 'e.g. Dilip Kumar'} className={INPUT_CLASS} />
            </div>
          </div>
          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#657894]">Access Password</label>
              <span className="font-mono text-[10px] font-medium text-[#657894]">Gate: <code className="rounded bg-[#f0f5fc] px-1 py-0.5 text-[#10233f]">{INSTITUTION_GATE_PASSWORD}</code></span>
            </div>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[#657894]"><KeyRound className="h-4 w-4" /></div>
              <input type={showPassword ? 'text' : 'password'} required value={password} onChange={(e) => { setPassword(e.target.value); if (errorMsg) setErrorMsg(null); }} placeholder="Enter institution password" autoComplete="current-password" className={`${INPUT_CLASS} pr-10`} />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute inset-y-0 right-0 flex cursor-pointer items-center rounded-r-xl px-3 text-[#657894] hover:text-[#10233f] focus:outline-none focus-visible:text-blue-600"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <button type="submit" disabled={isSubmitting} className="mt-1.5 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold text-white shadow-md transition-all duration-200 hover:shadow-lg active:scale-[0.99] disabled:opacity-75 sm:text-[13px]" style={{ background: BRAND_GRADIENT }}>
            {isSubmitting ? (
              <span className="inline-flex items-center gap-2"><span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />Verifying Credentials…</span>
            ) : (
              <><span>Enter Workspace</span><ArrowRight className="h-3.5 w-3.5" /></>
            )}
          </button>
          <p className="pt-0.5 text-center text-[10px] font-medium text-[#657894]">Access restricted to authorised faculty & admin.</p>
        </form>

        <div className="mt-5 border-t border-[#eaf2fc] pt-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#657894]"><ShieldCheck className="h-3.5 w-3.5 text-blue-500" />Quick Fill Directory</span>
            <span className="text-[10px] text-[#94a3b8]">Click name to populate</span>
          </div>
          <div className="max-h-36 space-y-1.5 overflow-y-auto pr-1">
            {roleFilter === 'admin' ? (
              admins.map((a) => (
                <button key={a.id} type="button" onClick={() => handleQuickFill(a.name)} className={`flex w-full cursor-pointer items-center justify-between rounded-lg border p-2 text-left text-xs transition-colors ${selectedQuickFill === a.name ? 'border-blue-400 bg-blue-50/90 ring-1 ring-blue-300' : 'border-[#e2ecf9] bg-[#f6faff] hover:bg-[#eaf3fe]'}`}>
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-800">{a.avatarInitials}</span>
                    <span className="text-xs font-semibold text-[#10233f]">{a.name}</span>
                  </div>
                  <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[9px] font-bold text-blue-700">Admin</span>
                </button>
              ))
            ) : (
              facultyList.map((f) => (
                <button key={f.id} type="button" onClick={() => handleQuickFill(f.name)} className={`flex w-full cursor-pointer items-center justify-between rounded-lg border p-2 text-left text-xs transition-colors ${selectedQuickFill === f.name ? 'border-blue-400 bg-blue-50/90 ring-1 ring-blue-300' : 'border-[#e2ecf9] bg-[#f8fbff] hover:bg-[#eaf3fe]'}`}>
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-700">{f.avatarInitials}</span>
                    <span className="max-w-[170px] truncate text-xs font-semibold text-[#10233f]">{f.name}</span>
                  </div>
                  <span className="shrink-0 text-[10px] font-medium text-[#657894]">{f.deptShort} · {f.currentSection}</span>
                </button>
              ))
            )}
          </div>
        </div>

        {onReplaySplash && (
          <div className="mt-3 text-center">
            <button type="button" onClick={onReplaySplash} className="inline-flex cursor-pointer items-center gap-1 text-[10px] text-[#657894] transition-colors hover:text-[#10233f]">
              <Sparkles className="h-3 w-3" />Replay Intro Splash
            </button>
          </div>
        )}
      </div>
    </main>
  );
};
