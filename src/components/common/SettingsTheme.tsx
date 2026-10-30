import React from 'react';
import { useApp } from '../../context/AppContext';
import { Check, LockKeyhole, Monitor, ShieldCheck, UserRound } from 'lucide-react';

export const SettingsTheme: React.FC = () => {
  const { currentUser } = useApp();

  return (
    <div className="max-w-4xl space-y-5 animate-in fade-in duration-200">
      <section className="rounded-2xl border border-[#e7e7e4] bg-white p-5 shadow-[0_8px_24px_rgba(0,0,0,0.05)] sm:p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#eef6f0] text-[#1f9d55]">
            <Monitor className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#1f9d55]">Workspace settings</p>
            <h2 className="mt-1 text-lg font-bold tracking-tight text-[#171717]">A calm, consistent workspace</h2>
            <p className="mt-1.5 max-w-2xl text-sm leading-6 text-[#737373]">
              AJU BOT uses a standardized light interface so schedules, people, and approvals stay easy to scan across every role and device.
            </p>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between gap-4 rounded-xl border border-[#e2e2df] bg-[#f7f7f5] px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-[#1f9d55] shadow-sm">
              <Check className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-bold text-[#171717]">Light mode</p>
              <p className="text-xs text-[#737373]">Standardized for clarity and accessibility</p>
            </div>
          </div>
          <span className="rounded-full bg-[#efefed] px-2.5 py-1 text-[11px] font-bold text-[#1f9d55]">Active</span>
        </div>
      </section>

      <section className="rounded-2xl border border-[#e7e7e4] bg-white p-5 shadow-[0_8px_24px_rgba(0,0,0,0.05)] sm:p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#f0f0ee] text-[#525252]"><UserRound className="h-4 w-4" /></div>
          <div>
            <h3 className="text-sm font-bold text-[#171717]">Account profile</h3>
            <p className="mt-0.5 text-xs text-[#737373]">Current session and institutional access details</p>
          </div>
        </div>

        <div className="mt-5 divide-y divide-[#f0f0ee] rounded-xl border border-[#ececea] px-4">
          <div className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <span className="text-xs text-[#737373]">Signed in as</span>
            <span className="text-sm font-bold text-[#171717]">{currentUser?.name}</span>
          </div>
          <div className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <span className="text-xs text-[#737373]">Role</span>
            <span className="text-sm font-semibold text-[#171717]">{currentUser?.role === 'admin' ? 'University administration' : 'Academic faculty'}</span>
          </div>
          <div className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <span className="text-xs text-[#737373]">Email</span>
            <span className="break-all text-sm font-semibold text-[#171717]">{currentUser?.email}</span>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-[#e7e7e4] bg-[#fafaf9] p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
          <div>
            <h3 className="text-sm font-bold text-[#171717]">Institutional access</h3>
            <p className="mt-1 text-xs leading-5 text-[#737373]">Your current browser session is verified for AJU BOT academic operations. Data changes are saved locally on this device.</p>
            <div className="mt-3 inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">
              <LockKeyhole className="h-3.5 w-3.5" /> Verified session
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
