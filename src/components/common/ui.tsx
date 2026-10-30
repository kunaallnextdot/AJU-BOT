import React, { useState } from 'react';
import { Minus, Plus } from 'lucide-react';

/** Small uppercase-free section heading, e.g. "Overview" above a row of stat cards. */
export const SectionLabel: React.FC<{ children: React.ReactNode; action?: React.ReactNode }> = ({ children, action }) => (
  <div className="mb-2.5 flex items-center justify-between">
    <h3 className="text-[15px] font-bold tracking-[-0.01em] text-[#171717]">{children}</h3>
    {action}
  </div>
);

type PillTone = 'up' | 'down' | 'neutral' | 'live';

const pillTone: Record<PillTone, string> = {
  up: 'bg-[#e7f6ec] text-[#17803f]',
  down: 'bg-[#fdecec] text-[#c2312f]',
  neutral: 'bg-[#efefed] text-[#525252]',
  live: 'bg-[#e7f6ec] text-[#17803f]',
};

export interface StatCardProps {
  title: string;
  value: React.ReactNode;
  context: string;
  pill?: { label: string; tone: PillTone };
  onClick?: () => void;
}

/** Image-1 style KPI: title, big number, comparison context on the left and a tinted delta pill on the right. */
export const StatCard: React.FC<StatCardProps> = ({ title, value, context, pill, onClick }) => {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      onClick={onClick}
      className="group flex w-full flex-col rounded-xl border border-[#e7e7e4] bg-white px-4 py-3.5 text-left transition hover:border-[#d4d4d1] hover:shadow-[0_8px_24px_rgba(0,0,0,0.05)]"
    >
      <span className="text-[15px] font-semibold text-[#171717]">{title}</span>
      <span className="mt-1 text-[28px] font-bold leading-tight tracking-[-0.02em] text-[#171717] tabular-nums">{value}</span>
      <span className="mt-2 flex items-center justify-between gap-2">
        <span className="truncate text-[13px] text-[#737373]">{context}</span>
        {pill && (
          <span className={`inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold ${pillTone[pill.tone]}`}>
            {pill.tone === 'live' && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#1f9d55]" />}
            {pill.label}
          </span>
        )}
      </span>
    </Tag>
  );
};

export interface LiveStripItem {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
}

/** Image-2 style summary strip: "In use now · Bookings today · Next free" separated by hairlines. */
export const LiveStrip: React.FC<{ items: LiveStripItem[] }> = ({ items }) => (
  <div className="grid grid-cols-1 divide-y divide-[#e7e7e4] rounded-xl border border-[#e7e7e4] bg-white sm:grid-cols-3 sm:divide-x sm:divide-y-0">
    {items.map((item) => (
      <div key={item.label} className="min-w-0 px-4 py-3.5 sm:px-5">
        <p className="text-[12px] font-medium text-[#737373]">{item.label}</p>
        <p className="mt-0.5 truncate text-xl font-bold tracking-[-0.02em] text-[#171717]">{item.value}</p>
        {item.sub && <p className="mt-0.5 truncate text-[12px] text-[#737373]">{item.sub}</p>}
      </div>
    ))}
  </div>
);

type ModuleTone = 'yellow' | 'pink' | 'blue';

const moduleTone: Record<ModuleTone, string> = {
  yellow: 'bg-[#fffbe6] text-[#c8900a]',
  pink: 'bg-[#fdf0fb] text-[#7a1f72]',
  blue: 'bg-[#eef3fd] text-[#2f62c9]',
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

/** Image-1 style module summary: header, three tinted count tiles and a completion bar, collapsible. */
export const ModuleCard: React.FC<ModuleCardProps> = ({ icon: Icon, title, description, stats, rateLabel = 'Completion Rate', rate, onViewMore, children }) => {
  const [open, setOpen] = useState(true);
  return (
    <section className="rounded-xl border border-[#e7e7e4] bg-white px-4 py-4 sm:px-5">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <span className="flex h-7 w-7 items-center justify-center rounded-md border border-[#2f5d50]/40 text-[#2f5d50]">
          <Icon className="h-4 w-4" />
        </span>
        <h3 className="text-[17px] font-bold text-[#2f5d50]">{title}</h3>
        <p className="min-w-0 flex-1 truncate text-[13px] text-[#737373]">{description}</p>
        <div className="ml-auto flex items-center gap-4">
          {onViewMore && (
            <button onClick={onViewMore} className="text-[13px] font-semibold text-[#2f62c9] hover:underline">
              View more
            </button>
          )}
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex h-7 w-7 items-center justify-center rounded-md text-[#171717] hover:bg-[#f0f0ee]"
            aria-label={open ? `Collapse ${title}` : `Expand ${title}`}
            aria-expanded={open}
          >
            {open ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="mt-4 sm:pl-11">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {stats.map((s) => (
              <div key={s.label} className={`flex items-center justify-center gap-3 rounded-lg px-3 py-2.5 text-[14px] ${moduleTone[s.tone]}`}>
                <span className="font-bold">{s.label}</span>
                <span className="tabular-nums text-[#404040]">{s.value}</span>
              </div>
            ))}
          </div>
          {rate !== undefined && (
            <div className="mt-4">
              <div className="mb-1.5 flex items-center justify-between text-[13px] font-medium text-[#171717]">
                <span>{rateLabel}</span>
                <span className="tabular-nums">{rate.toFixed(1)}%</span>
              </div>
              <div className="h-3.5 overflow-hidden rounded-sm bg-[#efefed]">
                <div className="h-full bg-[#2f5d50] transition-all duration-700" style={{ width: `${Math.min(100, Math.max(0, rate))}%` }} />
              </div>
            </div>
          )}
          {children}
        </div>
      )}
    </section>
  );
};

/** Tiny outlined action button used in tables ("Open HL7" style). */
export const RowAction: React.FC<{ onClick: () => void; children: React.ReactNode }> = ({ onClick, children }) => (
  <button
    onClick={onClick}
    className="rounded-md bg-[#f0f0ee] px-3 py-1.5 text-[12px] font-medium text-[#2f5d50] transition hover:bg-[#e5e5e2]"
  >
    {children}
  </button>
);
