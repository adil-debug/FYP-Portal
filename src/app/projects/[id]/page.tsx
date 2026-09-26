import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import {
  PROJECT_TYPE_LABELS,
  SOFTWARE_PHASE_LABELS,
  RESEARCH_PHASE_LABELS,
} from "@/lib/rubric";

const PHASE_STATUS_STYLES: Record<string, string> = {
  NOT_STARTED: "bg-slate-100 text-slate-500",
  IN_PROGRESS: "bg-amber-50 text-amber-700",
  COMPLETED: "bg-green-50 text-green-700",
};

const PHASE_STATUS_LABELS: Record<string, string> = {
  NOT_STARTED: "Not started",
  IN_PROGRESS: "In progress",
  COMPLETED: "Completed",
};

export default async function ProjectDetailPage(
  props: PageProps<"/projects/[id]">,
) {
  const { id } = await props.params;
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      members: { include: { student: true } },
      academicSession: true,
      supervisor: { select: { id: true, name: true, email: true } },
      weightScheme: { select: { name: true } },
      phases: true,
    },
  });

  if (!project) {
    notFound();
  }

  // Defense in depth: only the supervising faculty member or a coordinator
  // may view a project's detail page.
  const canView =
    user.role === "COORDINATOR" || project.supervisorId === user.userId;
  if (!canView) {
    redirect(user.role === "COORDINATOR" ? "/coordinator/projects" : "/dashboard");
  }

  const phaseLabels =
    project.type === "SOFTWARE" ? SOFTWARE_PHASE_LABELS : RESEARCH_PHASE_LABELS;

  const orderedPhases = [...project.phases].sort((a, b) => {
    const aKey = a.softwarePhase ?? a.researchPhase ?? "";
    const bKey = b.softwarePhase ?? b.researchPhase ?? "";
    return aKey.localeCompare(bKey);
  });

  const backHref = user.role === "COORDINATOR" ? "/coordinator/projects" : "/dashboard";

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-10">
      <Link
        href={backHref}
        className="w-fit text-sm font-medium text-slate-500 hover:text-slate-700"
      >
        &larr; Back
      </Link>

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
            {PROJECT_TYPE_LABELS[project.type]}
          </span>
          <span className="text-xs text-slate-400">
            {project.academicSession.title}
          </span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          {project.title}
        </h1>
        {project.description && (
          <p className="text-sm text-slate-600">{project.description}</p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Supervisor
          </p>
          <p className="mt-1 text-sm font-medium text-slate-900">
            {project.supervisor.name}
          </p>
          <p className="text-xs text-slate-500">{project.supervisor.email}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Weight scheme
          </p>
          <p className="mt-1 text-sm font-medium text-slate-900">
            {project.weightScheme.name}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Students
          </p>
          <ul className="mt-1 text-sm text-slate-900">
            {project.members.map((m) => (
              <li key={m.id}>
                {m.student.name}{" "}
                <span className="text-xs text-slate-400">
                  ({m.student.rollNumber})
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-4 py-3">
          <h2 className="font-semibold text-slate-900">
            {project.type === "SOFTWARE" ? "SDLC phases" : "Research phases"}
          </h2>
          <p className="text-xs text-slate-500">
            Phase tracking is edited by the supervisor in a later phase of
            this build.
          </p>
        </div>
        <ul className="divide-y divide-slate-100">
          {orderedPhases.map((phase) => {
            const key = phase.softwarePhase ?? phase.researchPhase ?? "";
            return (
              <li
                key={phase.id}
                className="flex items-center justify-between px-4 py-3 text-sm"
              >
                <span className="text-slate-700">
                  {phaseLabels[key as keyof typeof phaseLabels] ?? key}
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    PHASE_STATUS_STYLES[phase.status]
                  }`}
                >
                  {PHASE_STATUS_LABELS[phase.status]}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
