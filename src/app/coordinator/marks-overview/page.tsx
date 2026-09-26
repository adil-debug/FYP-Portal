import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { computeMarksProgress, isProjectAtRisk } from "@/lib/project-stats";
import { MarksOverviewTable } from "./marks-overview-table";

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
      weightScheme: { select: { componentWeights: true, weeklyMeetingWeeks: true } },
    },
  });

  const rows = projects.map((project) => {
    const progress = computeMarksProgress({
      studentCount: project.members.length,
      weights: project.weightScheme.componentWeights,
      marks: project.marks,
      weeklyMeetingWeeks: project.weightScheme.weeklyMeetingWeeks,
      projectType: project.type,
    });
    const atRisk = isProjectAtRisk({ phases: project.phases, marks: project.marks });
    const totalAwarded = project.marks.reduce((sum, m) => sum + Number(m.marksAwarded), 0);
    const totalMax = project.marks.reduce((sum, m) => sum + Number(m.maxMarks), 0);
    return {
      id: project.id,
      title: project.title,
      type: project.type,
      supervisorName: project.supervisor.name,
      sessionTitle: project.academicSession.title,
      marksEntered: progress.entered,
      marksTotal: progress.total,
      totalAwarded,
      totalMax,
      atRisk,
    };
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
          className="btn-outline text-sm"
        >
          Download award list
        </Link>
      </div>

      <MarksOverviewTable rows={rows} />
    </div>
  );
}
