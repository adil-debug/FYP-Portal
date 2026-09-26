"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ListSearch } from "@/components/list-search";
import { ProposalDeadlineBadge } from "@/components/proposal-deadline-badge";
import { PROJECT_TYPE_LABELS } from "@/lib/rubric";

export type ProjectRow = {
  id: string;
  title: string;
  type: keyof typeof PROJECT_TYPE_LABELS;
  supervisorName: string;
  studentNames: string[];
  sessionTitle: string;
  completedPhases: number;
  totalPhases: number;
  proposalDueAt: string | null;
  proposalSubmittedAt: string | null;
};

export function ProjectsTable({ projects }: { projects: ProjectRow[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.supervisorName.toLowerCase().includes(q) ||
        p.sessionTitle.toLowerCase().includes(q) ||
        p.studentNames.some((n) => n.toLowerCase().includes(q)),
    );
  }, [projects, query]);

  return (
    <div className="flex flex-col gap-3">
      <ListSearch
        value={query}
        onChange={setQuery}
        placeholder="Search by title, supervisor, student, or session…"
      />

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Supervisor</th>
              <th className="px-4 py-3">Students</th>
              <th className="px-4 py-3">Session</th>
              <th className="px-4 py-3">Progress</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                  {projects.length === 0
                    ? "No projects yet. Create one above."
                    : "No projects match your search."}
                </td>
              </tr>
            )}
            {filtered.map((project) => (
              <tr key={project.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/projects/${project.id}`}
                      className="font-medium text-indigo-700 hover:underline"
                    >
                      {project.title}
                    </Link>
                    <ProposalDeadlineBadge
                      proposalDueAt={
                        project.proposalDueAt ? new Date(project.proposalDueAt) : null
                      }
                      proposalSubmittedAt={
                        project.proposalSubmittedAt
                          ? new Date(project.proposalSubmittedAt)
                          : null
                      }
                    />
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {PROJECT_TYPE_LABELS[project.type]}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {project.supervisorName}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {project.studentNames.join(", ")}
                </td>
                <td className="px-4 py-3 text-slate-500">
                  {project.sessionTitle}
                </td>
                <td className="px-4 py-3 text-slate-500">
                  {project.completedPhases}/{project.totalPhases} phases
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
