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
        className="btn-outline-danger text-sm"
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
          className="btn-outline text-xs"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="btn-solid-danger text-xs"
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
