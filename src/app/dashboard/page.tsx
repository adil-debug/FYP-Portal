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
            <Link
              href="/account/change-password"
              className="btn-outline text-sm"
            >
              Change password
            </Link>
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
