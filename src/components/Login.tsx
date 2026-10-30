import React, { useState } from 'react';
import { motion, type Variants } from 'motion/react';
import { useApp } from '../context/AppContext';
import { ADMIN_USER } from '../data/mockData';
import { AlertCircle, ArrowRight, Building2, CheckCircle2, KeyRound, ShieldCheck, Sparkles, User } from 'lucide-react';
import heroCampusImg from '../assets/images/campus_hero_bg_1791294918467.jpg';

const EASE_OUT = [0.16, 1, 0.3, 1] as const;

const formStagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.45 } },
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 18, filter: 'blur(6px)' },
  show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.7, ease: EASE_OUT } },
};

const RING_TEXT = 'ARKA JAIN UNIVERSITY • JHARKHAND • AJU BOT • ';

interface LoginProps {
  onReplaySplash?: () => void;
}

export const Login: React.FC<LoginProps> = ({ onReplaySplash }) => {
  const { facultyList, loginUser } = useApp();
  const [roleFilter, setRoleFilter] = useState<'admin' | 'faculty'>('admin');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
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
        setErrorMsg('That access password is not valid. Please contact the Dean of IT for credentials.');
        setIsSubmitting(false);
      }, 250);
      return;
    }

    const adminName = ADMIN_USER.name.toLowerCase();
    // users table: admin@aju.example is the only admin account
    const isMatchedAdmin = [adminName, 'admin', ADMIN_USER.email.toLowerCase()].includes(trimmedName);

    if (isMatchedAdmin) {
      setTimeout(() => {
        loginUser(ADMIN_USER);
        setIsSubmitting(false);
      }, 300);
      return;
    }

    // Faculty sign in with their full name or their users.email
    const matchedFaculty = facultyList.find((f) => {
      const fName = f.name.toLowerCase();
      return fName === trimmedName || f.email.toLowerCase() === trimmedName || (trimmedName.length >= 4 && fName.includes(trimmedName));
    });

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
    <main className="min-h-screen bg-[#f4f4f2] p-3 text-[#171717] sm:p-5 lg:p-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 40, filter: 'blur(12px)' }}
        animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
        transition={{ duration: 0.9, ease: EASE_OUT }}
        className="mx-auto grid min-h-[calc(100vh-1.5rem)] max-w-[1320px] overflow-hidden rounded-[28px] border border-[#e7e7e4] bg-white shadow-[0_20px_70px_rgba(0,0,0,0.12)] sm:min-h-[calc(100vh-2.5rem)] lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative hidden min-h-[620px] overflow-hidden bg-[#171717] lg:flex">
          <img src={heroCampusImg} alt="AJU campus" className="login-campus-drift absolute inset-0 h-full w-full object-cover object-center opacity-80" />
          <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(10,10,10,0.96),rgba(23,23,23,0.68),rgba(23,23,23,0.24))]" />
          <div className="absolute -right-20 top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute bottom-14 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-[#4ade80]/20 blur-3xl" />
          <motion.svg
            viewBox="0 0 100 100"
            aria-hidden
            className="pointer-events-none absolute -bottom-24 -right-24 h-[420px] w-[420px]"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.4, ease: EASE_OUT, delay: 0.3 }}
          >
            <g className="login-ring-spin" style={{ transformOrigin: '50% 50%' }}>
              <path id="login-ring-path" d="M50,50 m-40,0 a40,40 0 1,1 80,0 a40,40 0 1,1 -80,0" fill="none" />
              <circle cx="50" cy="50" r="46" fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="0.3" />
              <text className="fill-white/30" style={{ fontSize: 2.6, fontWeight: 700 }}>
                <textPath href="#login-ring-path" textLength={2 * Math.PI * 40 - 1} lengthAdjust="spacing">{RING_TEXT + RING_TEXT}</textPath>
              </text>
            </g>
          </motion.svg>

          <div className="relative z-10 flex w-full flex-col justify-between p-10 xl:p-14">
            <div className="flex items-center gap-3 text-white">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/12 text-sm font-black ring-1 ring-white/20">A</span>
              <div>
                <p className="text-lg font-extrabold tracking-[0.14em]">AJU BOT</p>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-green-100/75">Academic operations</p>
              </div>
            </div>

            <div className="max-w-xl">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[11px] font-bold text-green-50 backdrop-blur-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_0_4px_rgba(110,231,183,0.12)]" /> Live faculty workspace
              </div>
              <h1 className="max-w-lg text-5xl font-black leading-[0.98] tracking-[-0.04em] text-white xl:text-6xl" aria-label="Arka Jain University">
                {['ARKA', 'JAIN', 'UNIVERSITY'].map((word, i) => (
                  <span key={word} className="block overflow-hidden pb-1" aria-hidden>
                    <motion.span
                      className={`inline-block ${i === 2 ? 'bg-gradient-to-r from-green-200 via-white to-[#d4d4d4] bg-clip-text text-transparent' : ''}`}
                      initial={{ y: '110%', rotate: 4 }}
                      animate={{ y: '0%', rotate: 0 }}
                      transition={{ duration: 0.9, ease: EASE_OUT, delay: 0.35 + i * 0.12 }}
                    >
                      {word}
                    </motion.span>
                  </span>
                ))}
              </h1>
              <motion.p className="mt-5 text-lg font-bold tracking-[-0.02em] text-white/90" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: EASE_OUT, delay: 0.8 }}>Keep every academic day moving.</motion.p>
              <p className="mt-3 max-w-md text-sm leading-7 text-green-50/75">One calm place for schedules, syllabus progress, faculty availability, leave workflows, and the decisions that keep teaching on track.</p>

              <div className="mt-8 grid max-w-md grid-cols-2 gap-3">
                {['Live schedules', 'Faculty visibility', 'Leave approvals', 'Academic calendar'].map((item, i) => (
                  <motion.div key={item} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE_OUT, delay: 0.95 + i * 0.08 }} className="flex items-center gap-2 rounded-xl border border-white/12 bg-white/8 px-3 py-2.5 text-xs font-semibold text-white/85 backdrop-blur-sm">
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-200" /> {item}
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3 text-[11px] font-semibold text-green-100/60">
              <span className="h-px w-8 bg-white/25" /> Built for faculty and academic administration
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center bg-white px-5 py-8 sm:px-10 lg:px-14">
          <motion.div className="w-full max-w-[430px]" variants={formStagger} initial="hidden" animate="show">
            <motion.div variants={fadeUp} className="mb-8 flex items-center gap-3 lg:hidden">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#171717] text-sm font-black text-white">A</span>
              <div><p className="text-lg font-extrabold tracking-[0.14em] text-[#2f5d50]">AJU BOT</p><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#737373]">Academic operations</p></div>
            </motion.div>

            <motion.div variants={fadeUp} className="mb-7">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#1f9d55]">Secure workspace access</p>
              <h2 className="mt-2 text-3xl font-extrabold tracking-[-0.04em] text-[#171717]">Welcome back.</h2>
              <p className="mt-2 text-sm leading-6 text-[#737373]">Sign in to pick up where your academic day left off.</p>
            </motion.div>

            <motion.div variants={fadeUp} className="mb-5 grid grid-cols-2 gap-1 rounded-xl border border-[#e7e7e4] bg-[#f7f7f5] p-1">
              {(['admin', 'faculty'] as const).map((role) => (
                <button key={role} type="button" onClick={() => handleRoleTabChange(role)} className={`rounded-lg py-2.5 text-xs font-bold capitalize transition ${roleFilter === role ? 'bg-white text-[#171717] shadow-sm' : 'text-[#737373] hover:text-[#171717]'}`}>{role}</button>
              ))}
            </motion.div>

            {errorMsg && <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium leading-5 text-red-700"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />{errorMsg}</div>}

            <motion.form variants={fadeUp} onSubmit={handleSubmit} className="space-y-4">
              <label className="block"><span className="mb-1.5 block text-xs font-bold text-[#404040]">Name or email</span><span className="relative block"><User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#a3a3a3]" /><input type="text" required value={fullName} onChange={(e) => { setFullName(e.target.value); setSelectedQuickFill(null); if (errorMsg) setErrorMsg(null); }} placeholder={roleFilter === 'admin' ? 'admin or admin@aju.example' : 'e.g. Dilip Kumar or dilip.kumar@aju.example'} className="w-full rounded-xl border border-[#e2e2df] bg-[#fafaf9] py-3 pl-10 pr-3 text-sm font-medium text-[#171717] transition placeholder:text-[#a3a3a3] focus:border-[#1f9d55] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#1f9d55]/10" /></span></label>
              <label className="block"><span className="mb-1.5 flex items-center justify-between text-xs font-bold text-[#404040]"><span>Access password</span><span className="font-mono text-[10px] font-medium text-[#a3a3a3]">Institution gate</span></span><span className="relative block"><KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#a3a3a3]" /><input type="password" required value={password} onChange={(e) => { setPassword(e.target.value); if (errorMsg) setErrorMsg(null); }} placeholder="Enter institution password" className="w-full rounded-xl border border-[#e2e2df] bg-[#fafaf9] py-3 pl-10 pr-3 text-sm font-medium text-[#171717] transition placeholder:text-[#a3a3a3] focus:border-[#1f9d55] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#1f9d55]/10" /></span></label>
              <button type="submit" disabled={isSubmitting} className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-[#171717] px-4 py-3 text-sm font-bold text-white shadow-[0_8px_18px_rgba(0,0,0,0.22)] transition hover:bg-black hover:shadow-[0_10px_24px_rgba(0,0,0,0.28)] active:scale-[0.99] disabled:opacity-70">{isSubmitting ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> Verifying credentials…</> : <>Enter workspace <ArrowRight className="h-4 w-4" /></>}</button>
            </motion.form>

            <motion.div variants={fadeUp} className="mt-7 border-t border-[#f0f0ee] pt-5">
              <div className="mb-3 flex items-center justify-between"><span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[#737373]"><ShieldCheck className="h-3.5 w-3.5 text-[#1f9d55]" /> Quick directory</span><span className="text-[10px] text-[#a3a3a3]">Demo access</span></div>
              <div className="max-h-36 space-y-1.5 overflow-y-auto pr-1">
                {roleFilter === 'admin' ? <button type="button" onClick={() => handleQuickFill(ADMIN_USER.name)} className={`flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-left transition ${selectedQuickFill === ADMIN_USER.name ? 'border-[#1f9d55] bg-[#eef6f0]' : 'border-[#e7e7e4] bg-[#fafaf9] hover:border-[#cfe3d6] hover:bg-[#f7f7f5]'}`}><span className="flex items-center gap-2.5"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#e3f0e7] text-[10px] font-extrabold text-[#2f5d50]">{ADMIN_USER.avatarInitials}</span><span className="text-xs font-bold text-[#171717]">{ADMIN_USER.name}</span></span><span className="text-[10px] font-bold text-[#737373]">Admin</span></button> : facultyList.map((f) => <button key={f.id} type="button" onClick={() => handleQuickFill(f.name)} className={`flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-left transition ${selectedQuickFill === f.name ? 'border-[#1f9d55] bg-[#eef6f0]' : 'border-[#e7e7e4] bg-[#fafaf9] hover:border-[#cfe3d6] hover:bg-[#f7f7f5]'}`}><span className="flex min-w-0 items-center gap-2.5"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#f0f0ee] text-[10px] font-extrabold text-[#525252]">{f.avatarInitials}</span><span className="truncate text-xs font-bold text-[#171717]">{f.name}</span></span><span className="shrink-0 text-[10px] font-semibold text-[#737373]">{f.deptShort} · {f.currentSection}</span></button>)}
              </div>
            </motion.div>

            <motion.div variants={fadeUp} className="mt-5 flex items-center justify-between text-[10px] font-medium text-[#a3a3a3]"><span className="flex items-center gap-1.5"><Building2 className="h-3 w-3" /> AJU academic network</span>{onReplaySplash && <button type="button" onClick={onReplaySplash} className="inline-flex items-center gap-1 transition hover:text-[#1f9d55]"><Sparkles className="h-3 w-3" /> Replay intro</button>}</motion.div>
          </motion.div>
        </section>
      </motion.div>
    </main>
  );
};
