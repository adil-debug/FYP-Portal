import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ProjectsTable } from "./projects-table";

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
          className="btn-solid-primary text-sm"
        >
          + New project
        </Link>
      </div>

      <ProjectsTable
        projects={projects.map((project) => ({
          id: project.id,
          title: project.title,
          type: project.type,
          supervisorName: project.supervisor.name,
          studentNames: project.members.map((m) => m.student.name),
          sessionTitle: project.academicSession.title,
          completedPhases: project.phases.filter((p) => p.status === "COMPLETED").length,
          totalPhases: project.phases.length,
          proposalDueAt: project.proposalDueAt ? project.proposalDueAt.toISOString() : null,
          proposalSubmittedAt: project.proposalSubmittedAt
            ? project.proposalSubmittedAt.toISOString()
            : null,
        }))}
      />
    </div>
  );
}
