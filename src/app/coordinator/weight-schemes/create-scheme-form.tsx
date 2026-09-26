"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { createWeightScheme } from "@/lib/actions/weight-schemes";
import {
  COMPONENT_TYPES,
  COMPONENT_LABELS,
  SEMESTERS,
  SEMESTER_LABELS,
} from "@/lib/rubric";
import type { ActionResult } from "@/lib/actions/sessions";

const initialState: ActionResult = {};

const DEFAULT_WEIGHTS: Record<string, Record<string, number>> = {
  FYP_1: {
    PROPOSAL_SUBMISSION: 10,
    WEEKLY_MEETINGS: 20,
    SDLC_PHASE: 50,
    PLAGIARISM: 10,
    THESIS_QUALITY: 10,
  },
  FYP_2: {
    PROPOSAL_SUBMISSION: 0,
    WEEKLY_MEETINGS: 20,
    SDLC_PHASE: 40,
    PLAGIARISM: 10,
    THESIS_QUALITY: 30,
  },
};

export function CreateSchemeForm({
  isCoordinator,
}: {
  // Only a coordinator can mark a scheme as the site-wide default — the
  // checkbox is hidden rather than just disabled for faculty, since a
  // faculty-created scheme is never eligible to become the default no
  // matter what they check (createWeightScheme ignores it server-side
  // for non-coordinators too).
  isCoordinator: boolean;
}) {
  const [state, formAction, isPending] = useActionState(
    createWeightScheme,
    initialState,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const [weights, setWeights] =
    useState<Record<string, Record<string, number>>>(DEFAULT_WEIGHTS);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
      setWeights(DEFAULT_WEIGHTS);
    }
  }, [state.success]);

  const totals = useMemo(() => {
    const result: Record<string, number> = {};
    for (const semester of SEMESTERS) {
      result[semester] = COMPONENT_TYPES.reduce(
        (sum, component) => sum + (weights[semester]?.[component] ?? 0),
        0,
      );
    }
    return result;
  }, [weights]);

  function setWeight(semester: string, component: string, value: number) {
    setWeights((prev) => ({
      ...prev,
      [semester]: { ...prev[semester], [component]: value },
    }));
  }

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      {state.error && (
        <div
          className={`rounded-md px-3 py-2 text-sm ${
            state.success
              ? "bg-amber-50 text-amber-800"
              : "bg-red-50 text-red-700"
          }`}
        >
          {state.error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-[2fr_auto]">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="name" className="text-sm font-medium text-slate-700">
            Scheme name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            placeholder="Default FYP Scheme"
            className="field-input text-sm"
          />
        </div>
        {isCoordinator && (
          <label className="flex items-center gap-2 self-end pb-2 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              name="isDefault"
              defaultChecked
              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            Set as default scheme
          </label>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead>
            <tr>
              <th className="pb-2 pr-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Component
              </th>
              {SEMESTERS.map((semester) => (
                <th
                  key={semester}
                  className="pb-2 px-2 text-xs font-semibold uppercase tracking-wide text-slate-500"
                >
                  {SEMESTER_LABELS[semester]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {COMPONENT_TYPES.map((component) => (
              <tr key={component}>
                <td className="py-2 pr-2 font-medium text-slate-700">
                  {COMPONENT_LABELS[component]}
                </td>
                {SEMESTERS.map((semester) => (
                  <td key={semester} className="py-2 px-2">
                    <input
                      type="number"
                      name={`weight_${semester}_${component}`}
                      min={0}
                      max={100}
                      step="0.5"
                      value={weights[semester]?.[component] ?? 0}
                      onChange={(e) =>
                        setWeight(semester, component, Number(e.target.value))
                      }
                      className="field-input w-24 py-1.5 text-sm"
                    />
                  </td>
                ))}
              </tr>
            ))}
            <tr>
              <td className="pt-2 font-semibold text-slate-900">Total</td>
              {SEMESTERS.map((semester) => (
                <td
                  key={semester}
                  className={`pt-2 px-2 font-semibold ${
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

      <button
        type="submit"
        disabled={isPending}
        className="btn-solid-primary self-start text-sm"
      >
        {isPending ? "Creating…" : "Create weight scheme"}
      </button>
    </form>
  );
}
