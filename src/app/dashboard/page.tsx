import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { computeMarksProgress, isProjectAtRisk } from "@/lib/project-stats";
import { LogoutButton } from "./logout-button";
import { ProjectGrid } from "./project-grid";

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
      weightScheme: { select: { componentWeights: true, weeklyMeetingWeeks: true } },
    },
  });

  const atRiskCount = projects.filter((project) =>
    isProjectAtRisk({
      phases: project.phases,
      marks: project.marks,
    }),
  ).length;

  return (
    <div className="flex min-h-screen flex-1 flex-col bg-slate-50">
      <header className="bg-slate-900">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-500 text-sm font-bold text-white">
              PO
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold tracking-tight text-white sm:text-base">
                Project Oversight
              </p>
              <p className="text-xs text-slate-400">Faculty dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="min-w-0 text-right">
              <p className="truncate text-sm font-medium text-white">
                {user.name}
              </p>
              <p className="text-xs text-slate-400">Faculty</p>
            </div>
            <Link
              href="/account/change-password"
              className="rounded-md border border-white/15 px-3 py-1.5 text-sm font-medium text-slate-200 transition-colors hover:bg-white/5 hover:text-white"
            >
              Change password
            </Link>
            <LogoutButton className="rounded-md border border-white/15 px-3 py-1.5 text-sm font-medium text-slate-200 transition-colors hover:bg-white/5 hover:text-white" />
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 sm:py-10">
        <div className="flex flex-wrap items-start justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Your projects
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              {projects.length === 0
                ? "Projects you supervise as faculty."
                : `Supervising ${projects.length} project${projects.length === 1 ? "" : "s"}${
                    atRiskCount > 0
                      ? ` · ${atRiskCount} need${atRiskCount === 1 ? "s" : ""} attention`
                      : ""
                  }.`}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/students"
              className="btn-outline text-sm"
            >
              Students
            </Link>
            <Link
              href="/weight-schemes"
              className="btn-outline text-sm"
            >
              Weight schemes
            </Link>
            <Link
              href="/award-list"
              className="btn-outline text-sm"
            >
              Award list
            </Link>
            <Link
              href="/projects/new"
              className="btn-solid-primary text-sm"
            >
              + New project
            </Link>
          </div>
        </div>

        <ProjectGrid
          projects={projects.map((project) => {
            const completed = project.phases.filter(
              (p) => p.status === "COMPLETED",
            ).length;
            const total = project.phases.length;
            const marksProgress = computeMarksProgress({
              studentCount: project.members.length,
              weights: project.weightScheme.componentWeights,
              marks: project.marks,
              weeklyMeetingWeeks: project.weightScheme.weeklyMeetingWeeks,
              projectType: project.type,
            });
            const atRisk = isProjectAtRisk({
              phases: project.phases,
              marks: project.marks,
            });
            return {
              id: project.id,
              title: project.title,
              type: project.type,
              sessionTitle: project.academicSession.title,
              studentNames: project.members.map((m) => m.student.name),
              atRisk,
              completedPhases: completed,
              totalPhases: total,
              marksEntered: marksProgress.entered,
              marksTotal: marksProgress.total,
              proposalDueAt: project.proposalDueAt
                ? project.proposalDueAt.toISOString()
                : null,
              proposalSubmittedAt: project.proposalSubmittedAt
                ? project.proposalSubmittedAt.toISOString()
                : null,
            };
          })}
        />
      </main>
    </div>
  );
}
