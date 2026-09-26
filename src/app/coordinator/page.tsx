import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function CoordinatorOverviewPage() {
  const [projectCount, facultyCount, studentCount, sessionCount, schemeCount] =
    await Promise.all([
      prisma.project.count(),
      prisma.user.count({ where: { role: "FACULTY" } }),
      prisma.student.count(),
      prisma.academicSession.count(),
      prisma.weightScheme.count(),
    ]);

  const cards = [
    { label: "Projects", value: projectCount, href: "/coordinator/projects" },
    { label: "Faculty accounts", value: facultyCount, href: "/coordinator/faculty" },
    { label: "Students", value: studentCount, href: "/coordinator/students" },
    { label: "Academic sessions", value: sessionCount, href: "/coordinator/sessions" },
    { label: "Weight schemes", value: schemeCount, href: "/coordinator/weight-schemes" },
  ];

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
    </div>
  );
}
