"use client";

import { useMemo, useState } from "react";
import { ListSearch } from "@/components/list-search";
import {
  COMPONENT_TYPES,
  COMPONENT_LABELS,
  SEMESTERS,
  SEMESTER_LABELS,
} from "@/lib/rubric";
import { SetDefaultButton } from "./set-default-button";
import { DeleteSchemeButton } from "./delete-scheme-button";

export type SchemeRow = {
  id: string;
  name: string;
  isDefault: boolean;
  createdByName: string;
  projectCount: number;
  weeklyMeetingWeeks: number;
  weights: { semester: string; componentType: string; maxMarks: number }[];
};

/**
 * Compact, filterable list of weight schemes. Each scheme collapses to a
 * single summary row (name, totals per semester, default/usage info) and
 * expands on click to show the full component breakdown table — instead
 * of the old layout, which rendered every scheme's full table at once and
 * pushed the page length out with each scheme created.
 *
 * `canSetDefault` controls whether the "Set as default" action renders at
 * all (coordinator-only); the delete action is always shown since both
 * roles may delete a scheme they're allowed to (server-side re-checked in
 * the action itself either way).
 */
export function SchemeList({
  schemes,
  canSetDefault,
}: {
  schemes: SchemeRow[];
  canSetDefault: boolean;
}) {
  const [query, setQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return schemes;
    return schemes.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.createdByName.toLowerCase().includes(q),
    );
  }, [schemes, query]);

  return (
    <div className="flex flex-col gap-3">
      <ListSearch
        value={query}
        onChange={setQuery}
        placeholder="Search schemes by name or creator…"
      />

      <div className="flex flex-col gap-3">
        {filtered.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-8 text-center text-slate-400">
            {schemes.length === 0
              ? "No weight schemes yet. Create one above."
              : "No schemes match your search."}
          </div>
        )}

        {filtered.map((scheme) => {
          const weightMap = new Map(
            scheme.weights.map((w) => [`${w.semester}_${w.componentType}`, w.maxMarks]),
          );
          const totals: Record<string, number> = { FYP_1: 0, FYP_2: 0 };
          for (const semester of SEMESTERS) {
            for (const component of COMPONENT_TYPES) {
              totals[semester] += weightMap.get(`${semester}_${component}`) ?? 0;
            }
          }
          const isExpanded = expandedId === scheme.id;

          return (
            <div
              key={scheme.id}
              className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
            >
              <div className="flex w-full flex-wrap items-center justify-between gap-2 px-4 py-3">
                <button
                  type="button"
                  onClick={() => setExpandedId(isExpanded ? null : scheme.id)}
                  className="flex min-w-0 flex-1 items-center gap-2 rounded-md text-left transition-colors hover:bg-slate-50"
                >
                  <svg
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${
                      isExpanded ? "rotate-90" : ""
                    }`}
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-900">
                      {scheme.name}
                      {scheme.isDefault && (
                        <span className="ml-2 rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700">
                          Default
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-slate-500">
                      Created by {scheme.createdByName} &middot;{" "}
                      {scheme.projectCount} project{scheme.projectCount === 1 ? "" : "s"} &middot;{" "}
                      {scheme.weeklyMeetingWeeks} weeks of meetings &middot;{" "}
                      {SEMESTERS.map((s) => `${SEMESTER_LABELS[s]}: ${totals[s]}/100`).join(" · ")}
                    </p>
                  </div>
                </button>
                <div className="flex shrink-0 items-center gap-2">
                  {canSetDefault && (
                    <SetDefaultButton schemeId={scheme.id} isDefault={scheme.isDefault} />
                  )}
                  <DeleteSchemeButton
                    schemeId={scheme.id}
                    isDefault={scheme.isDefault}
                    projectCount={scheme.projectCount}
                  />
                </div>
              </div>

              {isExpanded && (
                <div className="overflow-x-auto border-t border-slate-100">
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
                        <td className="px-4 py-2 font-semibold text-slate-900">Total</td>
                        {SEMESTERS.map((semester) => (
                          <td
                            key={semester}
                            className={`px-4 py-2 font-semibold ${
                              totals[semester] === 100 ? "text-green-600" : "text-amber-600"
                            }`}
                          >
                            {totals[semester]} / 100
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
