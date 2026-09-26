"use client";

import { useMemo, useState } from "react";
import { ListSearch } from "@/components/list-search";
import { DeleteStudentButton } from "./delete-student-button";

export type StudentRow = {
  id: string;
  name: string;
  rollNumber: string;
  email: string;
  projectCount: number;
};

export function StudentsTable({ students }: { students: StudentRow[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return students;
    return students.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.rollNumber.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q),
    );
  }, [students, query]);

  return (
    <div className="flex flex-col gap-3">
      <ListSearch
        value={query}
        onChange={setQuery}
        placeholder="Search by name, roll number, or email…"
      />

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Roll number</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Projects</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                  {students.length === 0
                    ? "No students yet. Add one above."
                    : "No students match your search."}
                </td>
              </tr>
            )}
            {filtered.map((student) => (
              <tr key={student.id}>
                <td className="px-4 py-3 font-medium text-slate-900">
                  {student.name}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {student.rollNumber}
                </td>
                <td className="px-4 py-3 text-slate-600">{student.email}</td>
                <td className="px-4 py-3 text-slate-600">
                  {student.projectCount}
                </td>
                <td className="px-4 py-3 text-right align-top">
                  <DeleteStudentButton studentId={student.id} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
