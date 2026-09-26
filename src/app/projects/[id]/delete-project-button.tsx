"use client";

import { useActionState, useState } from "react";
import { deleteProject } from "@/lib/actions/projects";
import type { ActionResult } from "@/lib/actions/sessions";

const initialState: ActionResult = {};

export function DeleteProjectButton({ projectId }: { projectId: string }) {
  const [confirming, setConfirming] = useState(false);
  const [state, formAction, isPending] = useActionState(
    deleteProject,
    initialState,
  );

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="btn-outline-danger text-sm"
      >
        Delete project
      </button>
    );
  }

  return (
    <form action={formAction} className="flex flex-col items-end gap-1.5">
      <input type="hidden" name="projectId" value={projectId} />
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-500">
          Permanently delete this project?
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
