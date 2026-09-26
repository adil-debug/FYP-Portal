"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ListSearch } from "@/components/list-search";
import { PROJECT_TYPE_LABELS } from "@/lib/rubric";

export type MarksOverviewRow = {
  id: string;
  title: string;
  type: keyof typeof PROJECT_TYPE_LABELS;
  supervisorName: string;
  sessionTitle: string;
  marksEntered: number;
  marksTotal: number;
  totalAwarded: number;
  totalMax: number;
  atRisk: boolean;
};

export function MarksOverviewTable({ rows }: { rows: MarksOverviewRow[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        r.supervisorName.toLowerCase().includes(q) ||
        r.sessionTitle.toLowerCase().includes(q),
    );
  }, [rows, query]);

  return (
    <div className="flex flex-col gap-3">
      <ListSearch
        value={query}
        onChange={setQuery}
        placeholder="Search by title, supervisor, or session…"
      />

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Supervisor</th>
              <th className="px-4 py-3">Session</th>
              <th className="px-4 py-3">Marks entered</th>
              <th className="px-4 py-3">Running total</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-slate-400">
                  {rows.length === 0 ? "No projects yet." : "No projects match your search."}
                </td>
              </tr>
            )}
            {filtered.map((row) => (
              <tr key={row.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <Link
                    href={`/projects/${row.id}`}
                    className="font-medium text-indigo-700 hover:underline"
                  >
                    {row.title}
                  </Link>
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {PROJECT_TYPE_LABELS[row.type]}
                </td>
                <td className="px-4 py-3 text-slate-600">{row.supervisorName}</td>
                <td className="px-4 py-3 text-slate-500">{row.sessionTitle}</td>
                <td className="px-4 py-3 text-slate-600">
                  {row.marksEntered} / {row.marksTotal}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {row.totalMax === 0 ? "—" : `${row.totalAwarded} / ${row.totalMax}`}
                </td>
                <td className="px-4 py-3">
                  {row.atRisk ? (
                    <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700">
                      Needs attention
                    </span>
                  ) : (
                    <span className="rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-semibold text-green-700">
                      On track
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
