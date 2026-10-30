import React, { useMemo, useState } from 'react';
import { Search, Upload } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { RowAction } from '../common/ui';

interface RecentActivityProps {
  onOpenLeave: () => void;
  onOpenFaculty: (facultyId: string) => void;
}

const statusStyle: Record<string, string> = {
  Pending: 'bg-[#fff6df] text-[#a66c00]',
  Approved: 'bg-[#e7f6ec] text-[#17803f]',
  Rejected: 'bg-[#fdecec] text-[#c2312f]',
};

export const RecentActivity: React.FC<RecentActivityProps> = ({ onOpenLeave, onOpenFaculty }) => {
  const { leaveRequests } = useApp();
  const [query, setQuery] = useState('');

  const rows = useMemo(() => {
    const all = [...leaveRequests]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((leave) => ({
        id: leave.id,
        facultyId: leave.facultyId,
        activity: `Leave request — ${leave.facultyName} (${leave.fromDate} → ${leave.toDate})`,
        department: leave.department,
        detail: `${leave.daysCount} day${leave.daysCount === 1 ? '' : 's'} · ${leave.substitutions.length} substitution${leave.substitutions.length === 1 ? '' : 's'}`,
        status: leave.status,
      }));
    const q = query.trim().toLowerCase();
    return q ? all.filter((r) => `${r.activity} ${r.department} ${r.status}`.toLowerCase().includes(q)) : all;
  }, [leaveRequests, query]);

  const exportCsv = () => {
    const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const lines = [
      ['Sl. No', 'Activity', 'Department', 'Detail', 'Status'].join(','),
      ...rows.map((r, i) => [String(i + 1), r.activity, r.department, r.detail, r.status].map(escape).join(',')),
    ];
    const url = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'aju-recent-activity.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="overflow-hidden rounded-xl border border-[#e7e7e4] bg-white">
      <div className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:p-4">
        <h3 className="shrink-0 text-[17px] font-bold text-[#171717]">Recent Activity</h3>
        <label className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#737373]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search..."
            className="w-full rounded-lg bg-[#f0f0ee] py-2.5 pl-10 pr-3 text-sm text-[#171717] placeholder:text-[#8a8a8a] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#171717]/10"
          />
        </label>
        <button
          onClick={exportCsv}
          disabled={rows.length === 0}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-[#e2e2df] bg-white px-4 py-2.5 text-sm font-semibold text-[#171717] transition hover:bg-[#f7f7f5] disabled:opacity-50"
        >
          <Upload className="h-4 w-4" /> Export
        </button>
      </div>

      <div className="max-h-[300px] overflow-auto">
        <table className="w-full min-w-[640px] text-left">
          <thead className="sticky top-0 bg-white">
            <tr className="border-b border-[#e7e7e4] text-[14px] text-[#171717]">
              <th className="w-20 px-4 py-2.5 font-semibold">Sl. No</th>
              <th className="px-4 py-2.5 font-semibold">Activity</th>
              <th className="px-4 py-2.5 font-semibold">Status</th>
              <th className="px-4 py-2.5 text-right font-semibold">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-sm text-[#737373]">
                  No activity matches “{query}”.
                </td>
              </tr>
            ) : (
              rows.map((r, i) => (
                <tr key={r.id} className="border-b border-[#f0f0ee] text-[14px] last:border-0 hover:bg-[#fafaf9]">
                  <td className="px-4 py-3 tabular-nums text-[#404040]">{i + 1}</td>
                  <td className="px-4 py-3">
                    <p className="text-[#171717]">{r.activity}</p>
                    <p className="mt-0.5 text-[12px] text-[#737373]">{r.department} · {r.detail}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-md px-2 py-1 text-[11px] font-semibold ${statusStyle[r.status]}`}>{r.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <RowAction onClick={() => onOpenFaculty(r.facultyId)}>Open Faculty</RowAction>
                      <RowAction onClick={onOpenLeave}>Open Leave</RowAction>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};
