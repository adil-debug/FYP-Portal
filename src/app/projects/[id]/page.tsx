import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import {
  PROJECT_TYPE_LABELS,
  SOFTWARE_PHASE_LABELS,
  RESEARCH_PHASE_LABELS,
  SEMESTERS,
  COMPONENT_TYPES,
} from "@/lib/rubric";
import { PhaseRow } from "./phase-row";
import { DeleteProjectButton } from "./delete-project-button";
import { MarksGrid } from "./marks-grid";
import { CommentThread, type CommentEntry } from "./comment-thread";
import { formatDateTime } from "@/lib/dates";

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
      weightScheme: { include: { componentWeights: true } },
      phases: true,
      marks: true,
      _count: { select: { marks: true } },
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
  const canEditPhases =
    user.role === "COORDINATOR" || project.supervisorId === user.userId;
  const canEditMarks = canEditPhases; // same rule: supervisor or coordinator

  // Same rule again: coordinator or this project's own supervisor. canView
  // above already enforces this for the whole page, so every faculty
  // member who reaches this point already qualifies — but the comments
  // list/create actions re-check it independently anyway (defense in
  // depth), so this fetch never has to trust the page-level check alone.
  const comments = await prisma.projectComment.findMany({
    where: { projectId: project.id },
    orderBy: { createdAt: "asc" },
    include: { author: { select: { name: true, role: true } } },
  });
  const commentEntries: CommentEntry[] = comments.map((c) => ({
    id: c.id,
    body: c.body,
    createdAt: formatDateTime(c.createdAt),
    authorId: c.authorId,
    authorName: c.author.name,
    authorRole: c.author.role,
  }));

  const weightsBySemester: Record<string, Record<string, number>> = {};
  for (const semester of SEMESTERS) {
    weightsBySemester[semester] = {};
    for (const component of COMPONENT_TYPES) {
      const weight = project.weightScheme.componentWeights.find(
        (w) => w.semester === semester && w.componentType === component,
      );
      weightsBySemester[semester][component] = weight
        ? Number(weight.maxMarks)
        : 0;
    }
  }

  const marksBySemester: Record<
    string,
    Record<string, { marksAwarded: number; maxMarks: number; remarks: string | null }>
  > = {};
  for (const semester of SEMESTERS) {
    marksBySemester[semester] = {};
  }
  for (const mark of project.marks) {
    marksBySemester[mark.semester][`${mark.studentId}_${mark.componentType}`] = {
      marksAwarded: Number(mark.marksAwarded),
      maxMarks: Number(mark.maxMarks),
      remarks: mark.remarks,
    };
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href={backHref}
          className="w-fit text-sm font-medium text-slate-500 hover:text-slate-700"
        >
          &larr; Back
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/projects/${project.id}/report`}
            className="btn-outline text-sm"
          >
            Print report
          </Link>
          {canEditPhases && (
            <>
              <Link
                href={`/projects/${project.id}/edit`}
                className="btn-outline text-sm"
              >
                Edit project
              </Link>
              <DeleteProjectButton projectId={project.id} />
            </>
          )}
        </div>
      </div>

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
        {project._count.marks > 0 && (
          <p className="text-xs text-amber-600">
            This project has {project._count.marks} recorded mark
            {project._count.marks === 1 ? "" : "s"} and can&apos;t be deleted
            until they&apos;re removed.
          </p>
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
            {canEditPhases
              ? "Click a phase to update its status and add notes."
              : "Phase tracking is managed by the supervisor and coordinator."}
          </p>
        </div>
        <ul className="divide-y divide-slate-100">
          {orderedPhases.map((phase) => {
            const key = phase.softwarePhase ?? phase.researchPhase ?? "";
            return (
              <PhaseRow
                key={phase.id}
                projectId={project.id}
                phaseId={phase.id}
                label={phaseLabels[key as keyof typeof phaseLabels] ?? key}
                status={phase.status}
                notes={phase.notes}
                updatedAt={formatDateTime(phase.updatedAt)}
                canEdit={canEditPhases}
              />
            );
          })}
        </ul>
      </div>

      <MarksGrid
        projectId={project.id}
        students={project.members.map((m) => ({
          id: m.student.id,
          name: m.student.name,
          rollNumber: m.student.rollNumber,
        }))}
        marksBySemester={marksBySemester}
        weightsBySemester={weightsBySemester}
        canEdit={canEditMarks}
      />

      <CommentThread
        projectId={project.id}
        comments={commentEntries}
        currentUserId={user.userId}
        isCoordinator={user.role === "COORDINATOR"}
      />
    </div>
  );
}
