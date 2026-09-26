import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { SchemeList } from "@/app/coordinator/weight-schemes/scheme-list";
import { CreateSchemeForm } from "@/app/coordinator/weight-schemes/create-scheme-form";

export default async function FacultyWeightSchemesPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  if (user.role === "COORDINATOR") {
    redirect("/coordinator/weight-schemes");
  }

  const schemes = await prisma.weightScheme.findMany({
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    include: {
      componentWeights: true,
      createdBy: { select: { name: true } },
      _count: { select: { projects: true } },
    },
  });

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8 sm:px-6 sm:py-10">
      <div>
        <Link
          href="/dashboard"
          className="text-sm font-medium text-slate-500 hover:text-slate-700"
        >
          &larr; Back to dashboard
        </Link>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
          Weight Schemes
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          How the 100 marks in each semester are split across the 5 rubric
          components. You can create your own scheme here and assign it to
          a project you supervise from that project's create/edit page —
          only a coordinator can change which scheme is the site-wide
          default. You can delete any scheme once it's no longer used by
          any project. Click a scheme to see its full breakdown.
        </p>
      </div>

      <CreateSchemeForm isCoordinator={false} />

      <SchemeList
        canSetDefault={false}
        schemes={schemes.map((scheme) => ({
          id: scheme.id,
          name: scheme.name,
          isDefault: scheme.isDefault,
          createdByName: scheme.createdBy.name,
          projectCount: scheme._count.projects,
          weeklyMeetingWeeks: scheme.weeklyMeetingWeeks,
          weights: scheme.componentWeights.map((w) => ({
            semester: w.semester,
            componentType: w.componentType,
            maxMarks: Number(w.maxMarks),
          })),
        }))}
      />
    </div>
  );
}
