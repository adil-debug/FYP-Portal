import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PROJECT_TYPE_LABELS } from "@/lib/rubric";
import { computeMarksProgress, isProjectAtRisk } from "@/lib/project-stats";

export default async function MarksOverviewPage() {
  const projects = await prisma.project.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      academicSession: true,
      supervisor: { select: { name: true } },
      members: { select: { studentId: true } },
      phases: { select: { status: true } },
      marks: {
        select: {
          studentId: true,
          semester: true,
          componentType: true,
          marksAwarded: true,
          maxMarks: true,
        },
      },
      weightScheme: { select: { componentWeights: true } },
    },
  });

  const rows = projects.map((project) => {
    const progress = computeMarksProgress({
      studentCount: project.members.length,
      weights: project.weightScheme.componentWeights,
      marks: project.marks,
    });
    const atRisk = isProjectAtRisk({ phases: project.phases, marks: project.marks });
    const totalAwarded = project.marks.reduce((sum, m) => sum + Number(m.marksAwarded), 0);
    const totalMax = project.marks.reduce((sum, m) => sum + Number(m.maxMarks), 0);
    return { project, progress, atRisk, totalAwarded, totalMax };
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Marks overview
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Marking progress across every project, regardless of supervisor.
          </p>
        </div>
        <Link
          href="/coordinator/award-list"
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
        >
          Download award list
        </Link>
      </div>

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
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-slate-400">
                  No projects yet.
                </td>
              </tr>
            )}
            {rows.map(({ project, progress, atRisk, totalAwarded, totalMax }) => (
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
                <td className="px-4 py-3 text-slate-500">
                  {project.academicSession.title}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {progress.entered} / {progress.total}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {totalMax === 0 ? "—" : `${totalAwarded} / ${totalMax}`}
                </td>
                <td className="px-4 py-3">
                  {atRisk ? (
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
