import { prisma } from "@/lib/prisma";
import { CreateSchemeForm } from "./create-scheme-form";
import { SetDefaultButton } from "./set-default-button";
import { DeleteSchemeButton } from "./delete-scheme-button";
import {
  COMPONENT_TYPES,
  COMPONENT_LABELS,
  SEMESTERS,
  SEMESTER_LABELS,
} from "@/lib/rubric";

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
          unless a faculty member picks a different one.
        </p>
      </div>

      <CreateSchemeForm />

      <div className="flex flex-col gap-4">
        {schemes.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-8 text-center text-slate-400">
            No weight schemes yet. Create one above.
          </div>
        )}

        {schemes.map((scheme) => {
          const weightMap = new Map(
            scheme.componentWeights.map((w) => [
              `${w.semester}_${w.componentType}`,
              Number(w.maxMarks),
            ]),
          );
          const totals: Record<string, number> = { FYP_1: 0, FYP_2: 0 };
          for (const semester of SEMESTERS) {
            for (const component of COMPONENT_TYPES) {
              totals[semester] +=
                weightMap.get(`${semester}_${component}`) ?? 0;
            }
          }

          return (
            <div
              key={scheme.id}
              className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900">
                    {scheme.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    Created by {scheme.createdBy.name} &middot;{" "}
                    {scheme._count.projects} project
                    {scheme._count.projects === 1 ? "" : "s"} using this
                    scheme
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <SetDefaultButton
                    schemeId={scheme.id}
                    isDefault={scheme.isDefault}
                  />
                  <DeleteSchemeButton
                    schemeId={scheme.id}
                    isDefault={scheme.isDefault}
                    projectCount={scheme._count.projects}
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
              <table className="w-full min-w-[420px] text-left text-sm">
                <thead>
                  <tr className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <th className="px-4 py-2">Component</th>
                    {SEMESTERS.map((semester) => (
                      <th key={semester} className="px-4 py-2">
                        {SEMESTER_LABELS[semester]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {COMPONENT_TYPES.map((component) => (
                    <tr key={component}>
                      <td className="px-4 py-2 text-slate-700">
                        {COMPONENT_LABELS[component]}
                      </td>
                      {SEMESTERS.map((semester) => (
                        <td key={semester} className="px-4 py-2 text-slate-600">
                          {weightMap.get(`${semester}_${component}`) ?? 0}
                        </td>
                      ))}
                    </tr>
                  ))}
                  <tr>
                    <td className="px-4 py-2 font-semibold text-slate-900">
                      Total
                    </td>
                    {SEMESTERS.map((semester) => (
                      <td
                        key={semester}
                        className={`px-4 py-2 font-semibold ${
                          totals[semester] === 100
                            ? "text-green-600"
                            : "text-amber-600"
                        }`}
                      >
                        {totals[semester]} / 100
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
