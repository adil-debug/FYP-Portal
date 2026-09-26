"use client";

import { useActionState, useEffect, useState } from "react";
import { upsertMark } from "@/lib/actions/marks";
import {
  COMPONENT_TYPES,
  COMPONENT_LABELS,
  SEMESTERS,
  SEMESTER_LABELS,
  getPhasesForType,
  getPhaseLabel,
  PROJECT_TYPES,
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

// marksBySemester["FYP_1"]["<studentId>_<componentType>_<weekNumber>_<phaseKey>"]
// — weekNumber is "0" and phaseKey is "" for every component except
// WEEKLY_MEETINGS / SDLC_PHASE, which get one entry per week/phase.
type MarksBySemester = Record<string, Record<string, MarkValue>>;

export function MarksGrid({
  projectId,
  students,
  marksBySemester,
  weightsBySemester,
  weeklyMeetingWeeks,
  projectType,
  canEdit,
}: {
  projectId: string;
  students: StudentRow[];
  marksBySemester: MarksBySemester;
  // weightsBySemester["FYP_1"]["<componentType>"] = maxMarks configured in
  // the project's weight scheme (0 if not configured for that semester)
  weightsBySemester: Record<string, Record<string, number>>;
  weeklyMeetingWeeks: number;
  projectType: (typeof PROJECT_TYPES)[number];
  canEdit: boolean;
}) {
  const [semester, setSemester] = useState<(typeof SEMESTERS)[number]>(
    SEMESTERS[0],
  );

  const phases = getPhasesForType(projectType);

  const semesterTotal = SEMESTERS.reduce<Record<string, number>>((acc, s) => {
    acc[s] = COMPONENT_TYPES.reduce(
      (sum, c) => sum + (weightsBySemester[s]?.[c] ?? 0),
      0,
    );
    return acc;
  }, {});

  function rowTotalFor(studentId: string) {
    const entries = marksBySemester[semester] ?? {};
    let total = 0;
    for (const key of Object.keys(entries)) {
      if (key.startsWith(`${studentId}_`)) {
        total += entries[key].marksAwarded;
      }
    }
    return total;
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
        <div>
          <h2 className="font-semibold text-slate-900">Marks</h2>
          <p className="text-xs text-slate-500">
            {canEdit
              ? "Click a cell to enter or update a student's mark. Weekly meetings and phase marks expand into a per-week/per-phase list."
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
            {students.map((student) => (
              <tr key={student.id}>
                <td className="px-4 py-2 align-top">
                  <p className="font-medium text-slate-900">{student.name}</p>
                  <p className="text-xs text-slate-400">{student.rollNumber}</p>
                </td>
                {COMPONENT_TYPES.map((component) => {
                  const max = weightsBySemester[semester]?.[component] ?? 0;
                  if (component === "WEEKLY_MEETINGS") {
                    return (
                      <td key={component} className="px-3 py-2 align-top">
                        <MultiUnitCell
                          projectId={projectId}
                          studentId={student.id}
                          semester={semester}
                          componentType={component}
                          componentMax={max}
                          units={Array.from({ length: weeklyMeetingWeeks }, (_, i) => ({
                            key: String(i + 1),
                            label: `Week ${i + 1}`,
                            weekNumber: i + 1,
                            phaseKey: "",
                          }))}
                          marksBySemester={marksBySemester}
                          canEdit={canEdit}
                        />
                      </td>
                    );
                  }
                  if (component === "SDLC_PHASE") {
                    return (
                      <td key={component} className="px-3 py-2 align-top">
                        <MultiUnitCell
                          projectId={projectId}
                          studentId={student.id}
                          semester={semester}
                          componentType={component}
                          componentMax={max}
                          units={phases.map((phaseKey) => ({
                            key: phaseKey,
                            label: getPhaseLabel(projectType, phaseKey),
                            weekNumber: 0,
                            phaseKey,
                          }))}
                          marksBySemester={marksBySemester}
                          canEdit={canEdit}
                        />
                      </td>
                    );
                  }
                  const mark = marksBySemester[semester]?.[`${student.id}_${component}_0_`];
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
                  {rowTotalFor(student.id)} / {semesterTotal[semester]}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const initialState: ActionResult = {};

/**
 * A component column that's actually made of several equal-share
 * sub-units (weeks, for WEEKLY_MEETINGS; phases, for SDLC_PHASE). Shows
 * "entered/total" as a summary, and expands into a list of one small mark
 * form per unit — so a supervisor can mark Week 1, Week 2, … or
 * Requirements, Design, … individually instead of one lump number for
 * the whole semester.
 */
function MultiUnitCell({
  projectId,
  studentId,
  semester,
  componentType,
  componentMax,
  units,
  marksBySemester,
  canEdit,
}: {
  projectId: string;
  studentId: string;
  semester: string;
  componentType: string;
  componentMax: number;
  units: { key: string; label: string; weekNumber: number; phaseKey: string }[];
  marksBySemester: MarksBySemester;
  canEdit: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const notConfigured = componentMax <= 0;

  const entries = units.map((unit) => ({
    unit,
    mark:
      marksBySemester[semester]?.[
        `${studentId}_${componentType}_${unit.weekNumber}_${unit.phaseKey}`
      ],
  }));
  const enteredCount = entries.filter((e) => e.mark).length;
  const sum = entries.reduce((acc, e) => acc + (e.mark?.marksAwarded ?? 0), 0);

  if (notConfigured) {
    return <span className="text-xs text-slate-300">not set</span>;
  }

  if (!canEdit) {
    return (
      <div className="text-slate-600">
        {enteredCount > 0 ? (
          `${sum} / ${componentMax}`
        ) : (
          <span className="text-slate-300">&mdash;</span>
        )}
        <div className="text-xs text-slate-400">
          {enteredCount}/{units.length} entered
        </div>
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full rounded-md border border-transparent px-2 py-1 text-left transition-colors hover:border-indigo-300 hover:bg-indigo-50"
      >
        <span className="font-medium text-slate-900">
          {sum} / {componentMax}
        </span>
        <div className="text-xs text-slate-500">
          {enteredCount}/{units.length} entered &middot; {expanded ? "hide" : "expand"}
        </div>
      </button>

      {expanded && (
        <div className="mt-2 flex max-h-72 flex-col gap-2 overflow-y-auto rounded-md border border-indigo-200 bg-indigo-50/40 p-2">
          {entries.map(({ unit, mark }) => (
            <UnitMarkRow
              key={unit.key}
              projectId={projectId}
              studentId={studentId}
              semester={semester}
              componentType={componentType}
              weekNumber={unit.weekNumber}
              phaseKey={unit.phaseKey}
              label={unit.label}
              mark={mark}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/** One week's or one phase's mark entry, inside a MultiUnitCell's expanded list. */
function UnitMarkRow({
  projectId,
  studentId,
  semester,
  componentType,
  weekNumber,
  phaseKey,
  label,
  mark,
}: {
  projectId: string;
  studentId: string;
  semester: string;
  componentType: string;
  weekNumber: number;
  phaseKey: string;
  label: string;
  mark: MarkValue | undefined;
}) {
  const [editing, setEditing] = useState(false);
  const [state, formAction, isPending] = useActionState(upsertMark, initialState);

  useEffect(() => {
    if (state.success) {
      const timer = setTimeout(() => setEditing(false), 500);
      return () => clearTimeout(timer);
    }
  }, [state]);

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="flex items-center justify-between gap-2 rounded border border-transparent bg-white px-2 py-1 text-left text-xs transition-colors hover:border-indigo-300"
      >
        <span className="text-slate-700">{label}</span>
        <span className="font-medium text-slate-900">
          {mark ? `${mark.marksAwarded} / ${mark.maxMarks}` : (
            <span className="text-slate-400">Enter</span>
          )}
        </span>
      </button>
    );
  }

  return (
    <form
      action={formAction}
      className="flex flex-col gap-1.5 rounded border border-indigo-300 bg-white p-2"
    >
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="studentId" value={studentId} />
      <input type="hidden" name="semester" value={semester} />
      <input type="hidden" name="componentType" value={componentType} />
      {weekNumber > 0 && <input type="hidden" name="weekNumber" value={weekNumber} />}
      {phaseKey && <input type="hidden" name="phaseKey" value={phaseKey} />}

      <p className="text-xs font-medium text-slate-700">{label}</p>

      <div className="flex items-center gap-1">
        <input
          type="number"
          name="marksAwarded"
          min={0}
          max={mark?.maxMarks}
          step="0.01"
          defaultValue={mark?.marksAwarded ?? ""}
          autoFocus
          className="field-input w-16 py-1 text-sm"
        />
        {mark && <span className="text-xs text-slate-400">/ {mark.maxMarks}</span>}
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
          onClick={() => setEditing(false)}
          className="btn-outline px-2.5 py-1 text-xs"
        >
          Cancel
        </button>
      </div>
      {state.success && (
        <p className="text-xs font-medium text-green-600">Saved</p>
      )}
    </form>
  );
}

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
          step="0.01"
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
