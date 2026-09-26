"use client";

import { useActionState, useState } from "react";
import { updatePhaseProgress } from "@/lib/actions/phases";
import type { ActionResult } from "@/lib/actions/sessions";

const STATUS_OPTIONS = [
  { value: "NOT_STARTED", label: "Not started" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "COMPLETED", label: "Completed" },
] as const;

const STATUS_STYLES: Record<string, string> = {
  NOT_STARTED: "bg-slate-100 text-slate-500",
  IN_PROGRESS: "bg-amber-50 text-amber-700",
  COMPLETED: "bg-green-50 text-green-700",
};

const initialState: ActionResult = {};

export function PhaseRow({
  projectId,
  phaseId,
  label,
  status,
  notes,
  updatedAt,
  canEdit,
}: {
  projectId: string;
  phaseId: string;
  label: string;
  status: string;
  notes: string | null;
  updatedAt: string;
  canEdit: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [state, formAction, isPending] = useActionState(
    updatePhaseProgress,
    initialState,
  );

  if (!canEdit) {
    return (
      <li className="hover-row flex items-center justify-between px-4 py-3 text-sm">
        <span className="text-slate-700">{label}</span>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[status]}`}
        >
          {STATUS_OPTIONS.find((s) => s.value === status)?.label ?? status}
        </span>
      </li>
    );
  }

  return (
    <li className="hover-row px-4 py-3 text-sm">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between rounded-md border border-transparent px-2 py-1 -mx-2 text-left transition-colors hover:border-indigo-200 hover:bg-indigo-50/60"
      >
        <span className="text-slate-700">{label}</span>
        <span className="flex items-center gap-2">
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[status]}`}
          >
            {STATUS_OPTIONS.find((s) => s.value === status)?.label ?? status}
          </span>
          <span className="text-xs font-medium text-indigo-600">
            {expanded ? "Hide" : "Edit"}
          </span>
        </span>
      </button>

      {expanded && (
        <form
          action={formAction}
          className="mt-3 flex flex-col gap-3 rounded-lg bg-slate-50 p-3"
        >
          <input type="hidden" name="phaseId" value={phaseId} />
          <input type="hidden" name="projectId" value={projectId} />

          <div className="flex flex-col gap-1">
            <label
              htmlFor={`status-${phaseId}`}
              className="text-xs font-medium text-slate-600"
            >
              Status
            </label>
            <select
              id={`status-${phaseId}`}
              name="status"
              defaultValue={status}
              className="field-input"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label
              htmlFor={`notes-${phaseId}`}
              className="text-xs font-medium text-slate-600"
            >
              Notes (optional)
            </label>
            <textarea
              id={`notes-${phaseId}`}
              name="notes"
              defaultValue={notes ?? ""}
              rows={2}
              placeholder="Progress notes, blockers, next steps..."
              className="field-input"
            />
          </div>

          {state.error && (
            <p className="text-xs font-medium text-red-600">{state.error}</p>
          )}
          {state.success && (
            <p className="text-xs font-medium text-green-600">Saved.</p>
          )}

          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">
              Last updated: {updatedAt}
            </span>
            <button
              type="submit"
              disabled={isPending}
              className="btn-solid-primary text-xs"
            >
              {isPending ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      )}
    </li>
  );
}
