"use client";

import { useActionState, useState } from "react";
import { deleteFacultyAccount } from "@/lib/actions/faculty";
import type { ActionResult } from "@/lib/actions/sessions";

const initialState: ActionResult = {};

export function DeleteFacultyButton({
  facultyId,
  supervisedProjectCount,
}: {
  facultyId: string;
  supervisedProjectCount: number;
}) {
  const [confirming, setConfirming] = useState(false);
  // On success, deleteFacultyAccount itself calls redirect("/coordinator/faculty"),
  // so there's nothing to do here on success — only the error case renders.
  const [state, formAction, isPending] = useActionState(
    deleteFacultyAccount,
    initialState,
  );

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        disabled={supervisedProjectCount > 0}
        title={
          supervisedProjectCount > 0
            ? "Reassign or delete this faculty member's projects first"
            : undefined
        }
        className="rounded-md border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Delete account
      </button>
    );
  }

  return (
    <form action={formAction} className="flex flex-col items-end gap-1.5">
      <input type="hidden" name="facultyId" value={facultyId} />
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-500">
          Permanently delete this account?
        </span>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-60"
        >
          {isPending ? "Deleting…" : "Yes, delete"}
        </button>
      </div>
      {state.error && (
        <p className="text-xs font-medium text-red-600">{state.error}</p>
      )}
    </form>
  );
}
