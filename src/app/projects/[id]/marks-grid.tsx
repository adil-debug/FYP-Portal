"use client";

import { useActionState, useEffect, useState } from "react";
import { upsertMark } from "@/lib/actions/marks";
import {
  COMPONENT_TYPES,
  COMPONENT_LABELS,
  SEMESTERS,
  SEMESTER_LABELS,
} from "@/lib/rubric";
import type { ActionResult } from "@/lib/actions/sessions";

type MarkValue = {
  marksAwarded: number;
  maxMarks: number;
  remarks: string | null;
};

type StudentRow = {
  id: string;
  name: string;
  rollNumber: string;
};

export function MarksGrid({
  projectId,
  students,
  marksBySemester,
  weightsBySemester,
  canEdit,
}: {
  projectId: string;
  students: StudentRow[];
  // marksBySemester["FYP_1"]["<studentId>_<componentType>"] = MarkValue
  marksBySemester: Record<string, Record<string, MarkValue>>;
  // weightsBySemester["FYP_1"]["<componentType>"] = maxMarks configured in
  // the project's weight scheme (0 if not configured for that semester)
  weightsBySemester: Record<string, Record<string, number>>;
  canEdit: boolean;
}) {
  const [semester, setSemester] = useState<(typeof SEMESTERS)[number]>(
    SEMESTERS[0],
  );

  const semesterTotal = SEMESTERS.reduce<Record<string, number>>((acc, s) => {
    acc[s] = COMPONENT_TYPES.reduce(
      (sum, c) => sum + (weightsBySemester[s]?.[c] ?? 0),
      0,
    );
    return acc;
  }, {});

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
        <div>
          <h2 className="font-semibold text-slate-900">Marks</h2>
          <p className="text-xs text-slate-500">
            {canEdit
              ? "Click a cell to enter or update a student's mark."
              : "Marks are entered by the supervisor and coordinator."}
          </p>
        </div>
        <div className="flex gap-1 rounded-md border border-slate-200 bg-slate-50 p-1">
          {SEMESTERS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSemester(s)}
              className={`rounded px-3 py-1.5 text-xs font-semibold transition-colors ${
                semester === s
                  ? "bg-white text-indigo-700 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {SEMESTER_LABELS[s]}
              <span className="ml-1 font-normal text-slate-400">
                ({semesterTotal[s]} pts)
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-2">Student</th>
              {COMPONENT_TYPES.map((component) => (
                <th key={component} className="px-3 py-2">
                  {COMPONENT_LABELS[component]}
                  <div className="font-normal normal-case text-slate-400">
                    / {weightsBySemester[semester]?.[component] ?? 0}
                  </div>
                </th>
              ))}
              <th className="px-3 py-2">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {students.map((student) => {
              const rowMarks = COMPONENT_TYPES.map(
                (c) => marksBySemester[semester]?.[`${student.id}_${c}`],
              );
              const rowTotal = rowMarks.reduce(
                (sum, m) => sum + (m?.marksAwarded ?? 0),
                0,
              );
              return (
                <tr key={student.id}>
                  <td className="px-4 py-2 align-top">
                    <p className="font-medium text-slate-900">
                      {student.name}
                    </p>
                    <p className="text-xs text-slate-400">
                      {student.rollNumber}
                    </p>
                  </td>
                  {COMPONENT_TYPES.map((component) => {
                    const max = weightsBySemester[semester]?.[component] ?? 0;
                    const mark =
                      marksBySemester[semester]?.[`${student.id}_${component}`];
                    return (
                      <td key={component} className="px-3 py-2 align-top">
                        <MarkCell
                          projectId={projectId}
                          studentId={student.id}
                          semester={semester}
                          componentType={component}
                          max={max}
                          mark={mark}
                          canEdit={canEdit}
                        />
                      </td>
                    );
                  })}
                  <td className="px-3 py-2 align-top font-semibold text-slate-900">
                    {rowTotal} / {semesterTotal[semester]}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const initialState: ActionResult = {};

function MarkCell({
  projectId,
  studentId,
  semester,
  componentType,
  max,
  mark,
  canEdit,
}: {
  projectId: string;
  studentId: string;
  semester: string;
  componentType: string;
  max: number;
  mark: MarkValue | undefined;
  canEdit: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [state, formAction, isPending] = useActionState(upsertMark, initialState);

  useEffect(() => {
    if (state.success) {
      const timer = setTimeout(() => setExpanded(false), 600);
      return () => clearTimeout(timer);
    }
  }, [state]);

  const notConfigured = max <= 0;

  if (!canEdit || notConfigured) {
    return (
      <div className="text-slate-600">
        {notConfigured ? (
          <span className="text-xs text-slate-300">not set</span>
        ) : mark ? (
          `${mark.marksAwarded} / ${mark.maxMarks}`
        ) : (
          <span className="text-slate-300">&mdash;</span>
        )}
      </div>
    );
  }

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="w-full rounded-md border border-transparent px-2 py-1 text-left transition-colors hover:border-indigo-300 hover:bg-indigo-50"
        title="Click to enter or update this mark"
      >
        {mark ? (
          <span className="font-medium text-slate-900">
            {mark.marksAwarded} / {mark.maxMarks}
          </span>
        ) : (
          <span className="text-slate-400">Enter mark</span>
        )}
      </button>
    );
  }

  return (
    <form
      action={formAction}
      className="flex flex-col gap-1.5 rounded-md border border-indigo-200 bg-indigo-50/40 p-2"
    >
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="studentId" value={studentId} />
      <input type="hidden" name="semester" value={semester} />
      <input type="hidden" name="componentType" value={componentType} />

      <div className="flex items-center gap-1">
        <input
          type="number"
          name="marksAwarded"
          min={0}
          max={max}
          step="0.5"
          defaultValue={mark?.marksAwarded ?? ""}
          autoFocus
          className="field-input w-16 py-1 text-sm"
        />
        <span className="text-xs text-slate-400">/ {max}</span>
      </div>

      <input
        type="text"
        name="remarks"
        placeholder="Remarks (optional)"
        defaultValue={mark?.remarks ?? ""}
        className="field-input py-1 text-xs"
      />

      {state.error && (
        <p className="text-xs font-medium text-red-600">{state.error}</p>
      )}

      <div className="flex items-center gap-1.5">
        <button
          type="submit"
          disabled={isPending}
          className="btn-solid-primary px-2.5 py-1 text-xs"
        >
          {isPending ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="btn-outline px-2.5 py-1 text-xs"
        >
          Cancel
        </button>
      </div>
      {state.success && (
        <p className="text-xs font-medium text-green-600">
          Saved &mdash; closing…
        </p>
      )}
    </form>
  );
}
