import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { computeMarksProgress, isProjectAtRisk } from "@/lib/project-stats";

export default async function CoordinatorOverviewPage() {
  const [projectCount, facultyCount, studentCount, sessionCount, schemeCount, projects] =
    await Promise.all([
      prisma.project.count(),
      prisma.user.count({ where: { role: "FACULTY" } }),
      prisma.student.count(),
      prisma.academicSession.count(),
      prisma.weightScheme.count(),
      prisma.project.findMany({
        select: {
          id: true,
          phases: { select: { status: true } },
          members: { select: { studentId: true } },
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
      }),
    ]);

  const cards = [
    { label: "Projects", value: projectCount, href: "/coordinator/projects" },
    { label: "Faculty accounts", value: facultyCount, href: "/coordinator/faculty" },
    { label: "Students", value: studentCount, href: "/coordinator/students" },
    { label: "Academic sessions", value: sessionCount, href: "/coordinator/sessions" },
    { label: "Weight schemes", value: schemeCount, href: "/coordinator/weight-schemes" },
  ];

  let totalEntered = 0;
  let totalPossible = 0;
  let atRiskCount = 0;
  const phaseBandCounts = { notStarted: 0, inProgress: 0, done: 0 };

  for (const project of projects) {
    const progress = computeMarksProgress({
      studentCount: project.members.length,
      weights: project.weightScheme.componentWeights,
      marks: project.marks,
    });
    totalEntered += progress.entered;
    totalPossible += progress.total;

    if (isProjectAtRisk({ phases: project.phases, marks: project.marks })) {
      atRiskCount += 1;
    }

    const completed = project.phases.filter((p) => p.status === "COMPLETED").length;
    const total = project.phases.length;
    if (total === 0 || completed === 0) {
      const anyStarted = project.phases.some((p) => p.status !== "NOT_STARTED");
      if (!anyStarted) phaseBandCounts.notStarted += 1;
      else phaseBandCounts.inProgress += 1;
    } else if (completed === total) {
      phaseBandCounts.done += 1;
    } else {
      phaseBandCounts.inProgress += 1;
    }
  }

  const marksPct = totalPossible === 0 ? 0 : Math.round((totalEntered / totalPossible) * 100);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Coordinator overview
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Set up faculty, students, academic sessions, and marks weight
          schemes before creating projects.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-indigo-300 sm:p-5"
          >
            <p className="text-2xl font-bold text-slate-900 sm:text-3xl">{card.value}</p>
            <p className="mt-1 text-sm text-slate-500">{card.label}</p>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/coordinator/marks-overview"
          className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-indigo-300"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Marks entered across all projects
          </p>
          <div className="flex items-center gap-3">
            <p className="text-3xl font-bold text-slate-900">{marksPct}%</p>
            <p className="text-sm text-slate-500">
              {totalEntered} / {totalPossible} components marked
            </p>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-emerald-500"
              style={{ width: `${marksPct}%` }}
            />
          </div>
          <p className="mt-1 text-xs font-medium text-indigo-700">
            View full marks overview &rarr;
          </p>
        </Link>

        <div className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Projects needing attention
          </p>
          <div className="flex items-center gap-3">
            <p className="text-3xl font-bold text-slate-900">{atRiskCount}</p>
            <p className="text-sm text-slate-500">
              of {projectCount} project{projectCount === 1 ? "" : "s"}
            </p>
          </div>
          <p className="text-xs text-slate-500">
            Flagged when a project has no phase progress yet, or has any
            entered mark below 50% of its max.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Projects by phase progress
        </p>
        <PhaseBandChart
          notStarted={phaseBandCounts.notStarted}
          inProgress={phaseBandCounts.inProgress}
          done={phaseBandCounts.done}
        />
      </div>
    </div>
  );
}

function PhaseBandChart({
  notStarted,
  inProgress,
  done,
}: {
  notStarted: number;
  inProgress: number;
  done: number;
}) {
  const bands = [
    { label: "Not started", value: notStarted, color: "#94a3b8" }, // slate-400
    { label: "In progress", value: inProgress, color: "#f59e0b" }, // amber-500
    { label: "All phases done", value: done, color: "#10b981" }, // emerald-500
  ];
  const max = Math.max(1, ...bands.map((b) => b.value));

  return (
    <div className="flex flex-col gap-3">
      {bands.map((band) => (
        <div key={band.label} className="flex items-center gap-3">
          <span className="w-28 shrink-0 text-xs text-slate-500 sm:w-32">
            {band.label}
          </span>
          <div className="h-4 flex-1 overflow-hidden rounded bg-slate-100">
            <div
              className="h-full rounded transition-all"
              style={{
                width: `${(band.value / max) * 100}%`,
                backgroundColor: band.color,
              }}
            />
          </div>
          <span className="w-6 shrink-0 text-right text-xs font-semibold text-slate-700">
            {band.value}
          </span>
        </div>
      ))}
    </div>
  );
}
