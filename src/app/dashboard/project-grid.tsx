"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ListSearch } from "@/components/list-search";
import { ProposalDeadlineBadge } from "@/components/proposal-deadline-badge";
import { PROJECT_TYPE_LABELS } from "@/lib/rubric";

export type DashboardProjectRow = {
  id: string;
  title: string;
  type: keyof typeof PROJECT_TYPE_LABELS;
  sessionTitle: string;
  studentNames: string[];
  atRisk: boolean;
  completedPhases: number;
  totalPhases: number;
  marksEntered: number;
  marksTotal: number;
  proposalDueAt: string | null;
  proposalSubmittedAt: string | null;
};

export function ProjectGrid({ projects }: { projects: DashboardProjectRow[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.sessionTitle.toLowerCase().includes(q) ||
        p.studentNames.some((n) => n.toLowerCase().includes(q)),
    );
  }, [projects, query]);

  return (
    <div className="flex flex-col gap-4">
      <ListSearch
        value={query}
        onChange={setQuery}
        placeholder="Search by title, student, or session…"
      />

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-12 text-center text-slate-400">
          {projects.length === 0
            ? "You don't supervise any projects yet."
            : "No projects match your search."}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map((project) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-indigo-300"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
                    {PROJECT_TYPE_LABELS[project.type]}
                  </span>
                  {project.atRisk && (
                    <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700">
                      Needs attention
                    </span>
                  )}
                  <ProposalDeadlineBadge
                    proposalDueAt={project.proposalDueAt ? new Date(project.proposalDueAt) : null}
                    proposalSubmittedAt={
                      project.proposalSubmittedAt ? new Date(project.proposalSubmittedAt) : null
                    }
                  />
                </div>
                <span className="text-xs text-slate-400">{project.sessionTitle}</span>
              </div>
              <h2 className="font-semibold text-slate-900">{project.title}</h2>
              <p className="text-xs text-slate-500">{project.studentNames.join(", ")}</p>
              <div className="mt-1 flex items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-indigo-500"
                    style={{
                      width: `${
                        project.totalPhases === 0
                          ? 0
                          : (project.completedPhases / project.totalPhases) * 100
                      }%`,
                    }}
                  />
                </div>
                <span className="text-xs font-medium text-slate-500">
                  {project.completedPhases}/{project.totalPhases} phases
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-emerald-500"
                    style={{
                      width: `${
                        project.marksTotal === 0
                          ? 0
                          : (project.marksEntered / project.marksTotal) * 100
                      }%`,
                    }}
                  />
                </div>
                <span className="text-xs font-medium text-slate-500">
                  {project.marksEntered}/{project.marksTotal} marks
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
