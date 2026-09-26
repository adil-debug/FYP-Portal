"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ListSearch } from "@/components/list-search";

export type FacultyRow = {
  id: string;
  name: string;
  email: string;
  supervisedCount: number;
  createdAtLabel: string;
};

export function FacultyTable({ faculty }: { faculty: FacultyRow[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return faculty;
    return faculty.filter(
      (f) => f.name.toLowerCase().includes(q) || f.email.toLowerCase().includes(q),
    );
  }, [faculty, query]);

  return (
    <div className="flex flex-col gap-3">
      <ListSearch value={query} onChange={setQuery} placeholder="Search by name or email…" />

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Supervised projects</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                  {faculty.length === 0
                    ? "No faculty accounts yet. Create one above."
                    : "No faculty match your search."}
                </td>
              </tr>
            )}
            {filtered.map((member) => (
              <tr key={member.id}>
                <td className="px-4 py-3 font-medium text-slate-900">
                  {member.name}
                </td>
                <td className="px-4 py-3 text-slate-600">{member.email}</td>
                <td className="px-4 py-3 text-slate-600">
                  {member.supervisedCount}
                </td>
                <td className="px-4 py-3 text-slate-500">{member.createdAtLabel}</td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/coordinator/faculty/${member.id}`}
                    className="font-medium text-indigo-700 hover:underline"
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
