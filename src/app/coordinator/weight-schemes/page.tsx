import { prisma } from "@/lib/prisma";
import { CreateSchemeForm } from "./create-scheme-form";
import { SchemeList } from "./scheme-list";

export default async function WeightSchemesPage() {
  const schemes = await prisma.weightScheme.findMany({
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    include: {
      componentWeights: true,
      createdBy: { select: { name: true } },
      _count: { select: { projects: true } },
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Weight Schemes
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Configure how the 100 marks in each semester are split across the
          5 rubric components. The default scheme is used for new projects
          unless a faculty member picks a different one. Click a scheme to
          see its full breakdown.
        </p>
      </div>

      <CreateSchemeForm isCoordinator />

      <SchemeList
        canSetDefault
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
