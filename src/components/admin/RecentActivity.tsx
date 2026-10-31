import React, { useMemo, useState } from 'react';
import { Search, Upload } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { RowAction } from '../common/ui';

interface RecentActivityProps {
  onOpenLeave: () => void;
  onOpenFaculty: (facultyId: string) => void;
}

const statusStyle: Record<string, string> = {
  Pending: 'border-amber-200 bg-amber-50 text-amber-700',
  Approved: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  Rejected: 'border-red-200 bg-red-50 text-red-700',
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
    <section className="overflow-hidden rounded-2xl border border-[#dce8f7] bg-white shadow-[0_10px_30px_rgba(31,76,126,0.06)]">
      <div className="flex flex-col gap-3 border-b border-[#eaf2fc] p-4 sm:flex-row sm:items-center">
        <div className="shrink-0">
          <h3 className="text-[13px] font-bold text-[#10233f]">Recent Activity</h3>
          <p className="mt-0.5 text-[11px] text-[#657894]">Latest leave and substitution requests</p>
        </div>
        <label className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#8494aa]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search..."
            className="w-full rounded-xl border border-[#dce8f7] bg-[#f8fbff] py-2 pl-9 pr-3 text-xs text-[#10233f] placeholder:text-[#8494aa] focus:border-blue-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </label>
        <button
          onClick={exportCsv}
          disabled={rows.length === 0}
          className="inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-[#dce8f7] bg-white px-3.5 py-2 text-xs font-bold text-[#10233f] shadow-xs transition hover:border-blue-200 hover:bg-blue-50 disabled:opacity-50"
        >
          <Upload className="h-3.5 w-3.5" /> Export
        </button>
      </div>

      <div className="max-h-[300px] overflow-auto">
        <table className="data-table w-full min-w-[640px] border-collapse text-left">
          <thead className="sticky top-0 bg-white">
            <tr className="border-b border-[#eaf2fc]">
              <th className="w-20 px-4 py-2.5">Sl. No</th>
              <th className="px-4 py-2.5">Activity</th>
              <th className="px-4 py-2.5">Status</th>
              <th className="px-4 py-2.5 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-[11px] text-[#657894]">
                  No activity matches “{query}”.
                </td>
              </tr>
            ) : (
              rows.map((r, i) => (
                <tr key={r.id} className="border-b border-[#f0f6ff] last:border-0 hover:bg-[#f9fcff]">
                  <td className="px-4 py-3 font-mono tabular-nums text-[#657894]">{i + 1}</td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-[#10233f]">{r.activity}</p>
                    <p className="mt-0.5 text-[11px] text-[#657894]">{r.department} · {r.detail}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${statusStyle[r.status]}`}>{r.status}</span>
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
