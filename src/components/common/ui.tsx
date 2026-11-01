import React, { useState } from 'react';
import { Minus, Plus } from 'lucide-react';

/** Small section heading, e.g. "Overview" above a row of stat cards. */
export const SectionLabel: React.FC<{ children: React.ReactNode; action?: React.ReactNode }> = ({ children, action }) => (
  <div className="mb-2.5 flex items-center justify-between">
    <h3 className="text-[10px] font-bold uppercase tracking-wider text-[#657894]">{children}</h3>
    {action}
  </div>
);

type PillTone = 'up' | 'down' | 'neutral' | 'live';

const pillTone: Record<PillTone, string> = {
  up: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  down: 'bg-amber-50 text-amber-700 border border-amber-200',
  neutral: 'bg-[#f0f5fc] text-[#657894] border border-[#dce8f7]',
  live: 'bg-blue-50 text-blue-700 border border-blue-200',
};

export interface StatCardProps {
  title: string;
  value: React.ReactNode;
  context: string;
  pill?: { label: string; tone: PillTone };
  onClick?: () => void;
}

/** KPI card: uppercase label, big mono number with context, and a tinted status pill. */
export const StatCard: React.FC<StatCardProps> = ({ title, value, context, pill, onClick }) => {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      onClick={onClick}
      className={`group relative flex w-full flex-col overflow-hidden rounded-2xl border border-[#dce8f7] bg-white p-3.5 text-left shadow-[0_6px_20px_rgba(31,76,126,0.05)] card-lift sm:p-4 ${onClick ? 'cursor-pointer' : ''}`}
    >
      <span className="mb-2 flex items-center justify-between gap-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#657894]">{title}</span>
        {pill && (
          <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${pillTone[pill.tone]}`}>
            {pill.tone === 'live' && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />}
            {pill.label}
          </span>
        )}
      </span>
      <span className="flex items-baseline gap-1.5">
        <span className="font-mono text-xl font-extrabold tabular-nums text-[#10233f] sm:text-2xl">{value}</span>
        <span className="truncate text-[10px] font-medium text-[#657894]">{context}</span>
      </span>
    </Tag>
  );
};

export interface LiveStripItem {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
}

/** Summary strip: "In class now · Classes today · Next free" separated by hairlines. */
export const LiveStrip: React.FC<{ items: LiveStripItem[] }> = ({ items }) => (
  <div className="grid grid-cols-1 divide-y divide-[#eaf2fc] rounded-2xl border border-[#dce8f7] bg-white shadow-[0_6px_20px_rgba(31,76,126,0.05)] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
    {items.map((item) => (
      <div key={item.label} className="min-w-0 px-4 py-3.5">
        <p className="text-[10px] font-bold uppercase tracking-wider text-[#657894]">{item.label}</p>
        <p className="mt-1 truncate text-base font-extrabold tracking-tight text-[#10233f]">{item.value}</p>
        {item.sub && <p className="mt-0.5 truncate text-[11px] text-[#657894]">{item.sub}</p>}
      </div>
    ))}
  </div>
);

type ModuleTone = 'yellow' | 'pink' | 'blue';

const moduleTone: Record<ModuleTone, string> = {
  yellow: 'bg-amber-50 border-amber-200 text-amber-700',
  pink: 'bg-rose-50 border-rose-200 text-rose-700',
  blue: 'bg-blue-50 border-blue-200 text-blue-700',
};

export interface ModuleCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  stats: { label: string; value: number | string; tone: ModuleTone }[];
  rateLabel?: string;
  rate?: number; // 0-100
  onViewMore?: () => void;
  children?: React.ReactNode;
}

/** Module summary: header, three tinted count tiles and a completion bar, collapsible. */
export const ModuleCard: React.FC<ModuleCardProps> = ({ icon: Icon, title, description, stats, rateLabel = 'Completion Rate', rate, onViewMore, children }) => {
  const [open, setOpen] = useState(true);
  return (
    <section className="rounded-2xl border border-[#dce8f7] bg-white p-4.5 shadow-[0_10px_30px_rgba(31,76,126,0.06)] sm:p-5">
      <div className={`flex flex-wrap items-center gap-x-3 gap-y-1 ${open ? 'mb-3.5 border-b border-[#eaf2fc] pb-2.5' : ''}`}>
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-[#2563eb] to-[#1d4ed8] text-white shadow-xs">
          <Icon className="h-3.5 w-3.5" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-[13px] font-bold text-[#10233f]">{title}</h3>
          <p className="mt-0.5 truncate text-[11px] text-[#657894]">{description}</p>
        </div>
        <div className="ml-auto flex items-center gap-3">
          {onViewMore && (
            <button onClick={onViewMore} className="cursor-pointer text-[11px] font-bold text-blue-600 hover:text-blue-800">
              View more
            </button>
          )}
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg text-[#657894] hover:bg-[#f0f5fc] hover:text-[#10233f]"
            aria-label={open ? `Collapse ${title}` : `Expand ${title}`}
            aria-expanded={open}
          >
            {open ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {open && (
        <div>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
            {stats.map((s) => (
              <div key={s.label} className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 ${moduleTone[s.tone]}`}>
                <span className="text-[10px] font-bold uppercase tracking-wider">{s.label}</span>
                <span className="font-mono text-base font-extrabold tabular-nums text-[#10233f]">{s.value}</span>
              </div>
            ))}
          </div>
          {rate !== undefined && (
            <div className="mt-3.5">
              <div className="mb-1.5 flex items-center justify-between text-[11px] font-semibold text-[#657894]">
                <span>{rateLabel}</span>
                <span className="font-mono font-bold tabular-nums text-[#10233f]">{rate.toFixed(1)}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-[#eaf2fc]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#2563eb] to-[#1d4ed8] transition-all duration-700"
                  style={{ width: `${Math.min(100, Math.max(0, rate))}%` }}
                />
              </div>
            </div>
          )}
          {children}
        </div>
      )}
    </section>
  );
};

/** Tiny outlined action button used in tables. */
export const RowAction: React.FC<{ onClick: () => void; children: React.ReactNode }> = ({ onClick, children }) => (
  <button
    onClick={onClick}
    className="cursor-pointer rounded-lg border border-[#dce8f7] bg-white px-2.5 py-1 text-[11px] font-bold text-blue-600 transition hover:border-blue-200 hover:bg-blue-50"
  >
    {children}
  </button>
);
