import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PROJECT_TYPE_LABELS } from "@/lib/rubric";
import { computeMarksProgress, isProjectAtRisk } from "@/lib/project-stats";
import { LogoutButton } from "./logout-button";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  // Defense in depth: proxy.ts should already have redirected an
  // unauthenticated request to /login, but this route checks its own
  // session too rather than trusting proxy alone.
  if (!user) {
    redirect("/login");
  }

  // Coordinators have their own dedicated section; the rest of this page
  // is the Faculty dashboard.
  if (user.role === "COORDINATOR") {
    redirect("/coordinator");
  }

  const projects = await prisma.project.findMany({
    where: { supervisorId: user.userId },
    orderBy: { createdAt: "desc" },
    include: {
      members: { include: { student: true } },
      academicSession: true,
      phases: { select: { status: true } },
      marks: { select: { studentId: true, semester: true, componentType: true, marksAwarded: true, maxMarks: true } },
      weightScheme: { select: { componentWeights: true } },
    },
  });

  return (
    <div className="flex min-h-screen flex-1 flex-col bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
              PO
            </div>
            <span className="truncate text-base font-semibold tracking-tight text-slate-900 sm:text-lg">
              Project Oversight Portal
            </span>
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="min-w-0 text-right">
              <p className="truncate text-sm font-medium text-slate-900">
                {user.name}
              </p>
              <p className="text-xs text-slate-500">Faculty</p>
            </div>
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 sm:py-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Your projects
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Projects you supervise as faculty.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/weight-schemes"
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              Weight schemes
            </Link>
            <Link
              href="/award-list"
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              Award list
            </Link>
            <Link
              href="/projects/new"
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700"
            >
              + New project
            </Link>
          </div>
        </div>

        {projects.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-12 text-center text-slate-400">
            You don&apos;t supervise any projects yet.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {projects.map((project) => {
              const completed = project.phases.filter(
                (p) => p.status === "COMPLETED",
              ).length;
              const total = project.phases.length;
              const marksProgress = computeMarksProgress({
                studentCount: project.members.length,
                weights: project.weightScheme.componentWeights,
                marks: project.marks,
              });
              const atRisk = isProjectAtRisk({
                phases: project.phases,
                marks: project.marks,
              });
              return (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-indigo-300"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
                        {PROJECT_TYPE_LABELS[project.type]}
                      </span>
                      {atRisk && (
                        <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700">
                          Needs attention
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-400">
                      {project.academicSession.title}
                    </span>
                  </div>
                  <h2 className="font-semibold text-slate-900">
                    {project.title}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {project.members.map((m) => m.student.name).join(", ")}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-indigo-500"
                        style={{
                          width: `${total === 0 ? 0 : (completed / total) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-xs font-medium text-slate-500">
                      {completed}/{total} phases
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-emerald-500"
                        style={{
                          width: `${marksProgress.total === 0 ? 0 : (marksProgress.entered / marksProgress.total) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-xs font-medium text-slate-500">
                      {marksProgress.entered}/{marksProgress.total} marks
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
