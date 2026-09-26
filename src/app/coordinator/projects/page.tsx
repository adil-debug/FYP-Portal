import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PROJECT_TYPE_LABELS } from "@/lib/rubric";

export default async function CoordinatorProjectsPage() {
  const projects = await prisma.project.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      members: { include: { student: true } },
      academicSession: true,
      supervisor: { select: { name: true } },
      phases: { select: { status: true } },
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            All projects
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Every project across all faculty supervisors.
          </p>
        </div>
        <Link
          href="/projects/new"
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700"
        >
          + New project
        </Link>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
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
            {projects.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                  No projects yet. Create one above.
                </td>
              </tr>
            )}
            {projects.map((project) => {
              const completed = project.phases.filter(
                (p) => p.status === "COMPLETED",
              ).length;
              const total = project.phases.length;
              return (
                <tr key={project.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/projects/${project.id}`}
                      className="font-medium text-indigo-700 hover:underline"
                    >
                      {project.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {PROJECT_TYPE_LABELS[project.type]}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {project.supervisor.name}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {project.members.map((m) => m.student.name).join(", ")}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {project.academicSession.title}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {completed}/{total} phases
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
