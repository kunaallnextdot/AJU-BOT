import React from 'react';
import { useApp } from '../../context/AppContext';
import { Check, LockKeyhole, Palette, ShieldCheck, UserRound } from 'lucide-react';
import { THEME_PALETTES } from '../../data/mockData';

export const SettingsTheme: React.FC = () => {
  const { currentUser, currentTheme, setTheme } = useApp();

  return (
    <div className="max-w-4xl space-y-4 animate-in fade-in duration-200 sm:space-y-5">
      <section className="rounded-2xl border border-[#dce8f7] bg-white p-4.5 shadow-[0_10px_30px_rgba(31,76,126,0.06)] sm:p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-light)] text-[var(--accent)]">
            <Palette className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600">Appearance</p>
            <h2 className="mt-1 text-base font-extrabold tracking-tight text-[#10233f] sm:text-lg">Workspace theme</h2>
            <p className="mt-1 max-w-2xl text-xs leading-5 text-[#657894]">
              Pick a colour theme. Buttons, highlights, charts and progress bars across your whole workspace change right away.
              It is saved for <strong className="text-[#10233f]">{currentUser?.name}</strong> on this device.
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3" role="radiogroup" aria-label="Workspace theme">
          {THEME_PALETTES.map((theme) => {
            const active = theme.id === currentTheme.id;
            return (
              <button
                key={theme.id}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setTheme(theme.id)}
                className={`card-lift flex min-w-0 flex-col rounded-xl border-2 bg-white p-4 text-left transition-colors ${active ? 'shadow-md' : 'border-[#e2ecf9] hover:border-[#cbd5e1]'}`}
                style={active ? { borderColor: theme.primaryHex, boxShadow: `0 8px 24px ${theme.glowHex}` } : undefined}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="h-4 w-4 shrink-0 rounded-full" style={{ background: theme.primaryHex }} />
                    <span className="truncate text-[13px] font-bold text-[#10233f]">{theme.name}</span>
                  </span>
                  {active && (
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-white" style={{ background: theme.primaryHex }}>
                      <Check className="h-3 w-3" />
                    </span>
                  )}
                </div>
                <p className="mt-1.5 min-h-8 text-[11px] leading-4 text-[#657894]">{theme.description}</p>
                <div className="mt-3 flex gap-1.5 border-t border-[#f0f5fc] pt-3">
                  {[theme.primaryHex, theme.deepHex, theme.lightHex].map((c) => (
                    <span key={c} className="h-3 flex-1 rounded-md border border-black/5" style={{ background: c }} />
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-[#dce8f7] bg-white p-4.5 shadow-[0_10px_30px_rgba(31,76,126,0.06)] sm:p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#f0f5fc] text-[#475569]"><UserRound className="h-4 w-4" /></div>
          <div>
            <h3 className="text-[13px] font-bold text-[#10233f]">Account profile</h3>
            <p className="mt-0.5 text-xs text-[#657894]">Current session and institutional access details</p>
          </div>
        </div>

        <div className="mt-5 divide-y divide-[#f0f5fc] rounded-xl border border-[#e2ecf9] px-4">
          <div className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <span className="text-xs text-[#657894]">Signed in as</span>
            <span className="text-sm font-bold text-[#10233f]">{currentUser?.name}</span>
          </div>
          <div className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <span className="text-xs text-[#657894]">Role</span>
            <span className="text-sm font-semibold text-[#10233f]">{currentUser?.role === 'admin' ? 'University administration' : 'Academic faculty'}</span>
          </div>
          <div className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <span className="text-xs text-[#657894]">Email</span>
            <span className="break-all text-sm font-semibold text-[#10233f]">{currentUser?.email}</span>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-[#dce8f7] bg-[#f8fbff] p-4.5 sm:p-5">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
          <div>
            <h3 className="text-[13px] font-bold text-[#10233f]">Institutional access</h3>
            <p className="mt-1 text-xs leading-5 text-[#657894]">Your current browser session is verified for AJU BOT academic operations. Changes are saved to the AJU database, and kept on this device if the connection drops.</p>
            <div className="mt-3 inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">
              <LockKeyhole className="h-3.5 w-3.5" /> Verified session
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
