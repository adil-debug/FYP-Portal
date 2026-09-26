import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import {
  PROJECT_TYPE_LABELS,
  SOFTWARE_PHASE_LABELS,
  RESEARCH_PHASE_LABELS,
  SEMESTERS,
  SEMESTER_LABELS,
  COMPONENT_TYPES,
  COMPONENT_LABELS,
} from "@/lib/rubric";
import { getProposalDeadlineStatus, formatDate } from "@/lib/dates";
import { PrintButton } from "./print-button";

export default async function ProjectReportPage(
  props: PageProps<"/projects/[id]/report">,
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
      supervisor: { select: { name: true, email: true } },
      weightScheme: { include: { componentWeights: true } },
      phases: true,
      marks: true,
    },
  });

  if (!project) {
    notFound();
  }

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

  const deadlineStatus = getProposalDeadlineStatus({
    proposalDueAt: project.proposalDueAt,
    proposalSubmittedAt: project.proposalSubmittedAt,
  });

  const marksByStudent = new Map<
    string,
    Record<string, Record<string, { marksAwarded: number; maxMarks: number }>>
  >();
  for (const member of project.members) {
    const bySemester: Record<string, Record<string, { marksAwarded: number; maxMarks: number }>> = {};
    for (const semester of SEMESTERS) bySemester[semester] = {};
    marksByStudent.set(member.studentId, bySemester);
  }
  for (const mark of project.marks) {
    const bySemester = marksByStudent.get(mark.studentId);
    if (!bySemester) continue;
    bySemester[mark.semester][mark.componentType] = {
      marksAwarded: Number(mark.marksAwarded),
      maxMarks: Number(mark.maxMarks),
    };
  }

  const weightFor = (semester: string, component: string) => {
    const w = project.weightScheme.componentWeights.find(
      (row) => row.semester === semester && row.componentType === component,
    );
    return w ? Number(w.maxMarks) : 0;
  };

  const today = formatDate(new Date());

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8 sm:px-6 sm:py-10 print:px-0 print:py-0">
      <div className="flex items-center justify-between print:hidden">
        <Link
          href={`/projects/${project.id}`}
          className="text-sm font-medium text-slate-500 hover:text-slate-700"
        >
          &larr; Back to project
        </Link>
        <PrintButton />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm print:border-0 print:p-0 print:shadow-none">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              {project.title}
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              {PROJECT_TYPE_LABELS[project.type]} &middot; {project.academicSession.title}
            </p>
          </div>
          <p className="whitespace-nowrap text-xs text-slate-400">
            Generated {today}
          </p>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Supervisor
            </p>
            <p className="mt-1 text-sm text-slate-900">{project.supervisor.name}</p>
            <p className="text-xs text-slate-500">{project.supervisor.email}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Students
            </p>
            <ul className="mt-1 text-sm text-slate-900">
              {project.members.map((m) => (
                <li key={m.id}>
                  {m.student.name} ({m.student.rollNumber})
                </li>
              ))}
            </ul>
          </div>
        </div>

        {(project.proposalDueAt || project.proposalSubmittedAt) && (
          <div className="mt-4 rounded-md bg-slate-50 px-3 py-2 text-xs text-slate-600 print:bg-transparent print:px-0">
            {project.proposalDueAt && (
              <span>
                Proposal due:{" "}
                {formatDate(project.proposalDueAt)}
              </span>
            )}
            {project.proposalDueAt && project.proposalSubmittedAt && " · "}
            {project.proposalSubmittedAt && (
              <span>
                Submitted:{" "}
                {formatDate(project.proposalSubmittedAt)}
              </span>
            )}
            {deadlineStatus.kind === "overdue" && (
              <span className="ml-2 font-semibold text-red-600">
                Overdue by {deadlineStatus.daysOverdue} day
                {deadlineStatus.daysOverdue === 1 ? "" : "s"}
              </span>
            )}
          </div>
        )}

        <div className="mt-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            {project.type === "SOFTWARE" ? "SDLC phases" : "Research phases"}
          </h2>
          <table className="mt-2 w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="py-1.5 pr-2">Phase</th>
                <th className="py-1.5 pr-2">Status</th>
                <th className="py-1.5">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orderedPhases.map((phase) => {
                const key = phase.softwarePhase ?? phase.researchPhase ?? "";
                return (
                  <tr key={phase.id}>
                    <td className="py-1.5 pr-2 text-slate-900">
                      {phaseLabels[key as keyof typeof phaseLabels] ?? key}
                    </td>
                    <td className="py-1.5 pr-2 text-slate-600">
                      {phase.status === "NOT_STARTED"
                        ? "Not started"
                        : phase.status === "IN_PROGRESS"
                          ? "In progress"
                          : "Completed"}
                    </td>
                    <td className="py-1.5 text-slate-500">{phase.notes ?? "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {project.members.map((member) => {
          const bySemester = marksByStudent.get(member.studentId)!;
          return (
            <div key={member.id} className="mt-8 break-inside-avoid">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Marks — {member.student.name} ({member.student.rollNumber})
              </h2>
              {SEMESTERS.map((semester) => {
                let semesterEntered = 0;
                let semesterMax = 0;
                return (
                  <div key={semester} className="mt-2">
                    <p className="text-xs font-medium text-slate-700">
                      {SEMESTER_LABELS[semester]}
                    </p>
                    <table className="mt-1 w-full text-left text-sm">
                      <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                        <tr>
                          <th className="py-1.5 pr-2">Component</th>
                          <th className="py-1.5 pr-2">Awarded</th>
                          <th className="py-1.5">Max</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {COMPONENT_TYPES.map((component) => {
                          const maxMarks = weightFor(semester, component);
                          if (maxMarks <= 0) return null;
                          const entry = bySemester[semester][component];
                          if (entry) {
                            semesterEntered += entry.marksAwarded;
                            semesterMax += entry.maxMarks;
                          }
                          return (
                            <tr key={component}>
                              <td className="py-1.5 pr-2 text-slate-900">
                                {COMPONENT_LABELS[component]}
                              </td>
                              <td className="py-1.5 pr-2 text-slate-600">
                                {entry ? entry.marksAwarded : "—"}
                              </td>
                              <td className="py-1.5 text-slate-500">
                                {entry ? entry.maxMarks : maxMarks}
                              </td>
                            </tr>
                          );
                        })}
                        <tr className="font-semibold">
                          <td className="py-1.5 pr-2 text-slate-900">Total</td>
                          <td className="py-1.5 pr-2 text-slate-900">
                            {semesterEntered}
                          </td>
                          <td className="py-1.5 text-slate-900">{semesterMax}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
