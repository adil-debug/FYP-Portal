"use client";

import { useActionState, useState } from "react";
import { deleteWeightScheme } from "@/lib/actions/weight-schemes";
import type { ActionResult } from "@/lib/actions/sessions";

const initialState: ActionResult = {};

export function DeleteSchemeButton({
  schemeId,
  isDefault,
  projectCount,
}: {
  schemeId: string;
  isDefault: boolean;
  projectCount: number;
}) {
  const [confirming, setConfirming] = useState(false);
  const [state, formAction, isPending] = useActionState(
    deleteWeightScheme,
    initialState,
  );

  const disabledReason = isDefault
    ? "Make a different scheme the default first"
    : projectCount > 0
      ? "Reassign this scheme's projects to a different scheme first"
      : undefined;

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        disabled={!!disabledReason}
        title={disabledReason}
        className="rounded-md border border-red-200 px-2.5 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Delete
      </button>
    );
  }

  return (
    <form action={formAction} className="flex flex-col items-end gap-1.5">
      <input type="hidden" name="schemeId" value={schemeId} />
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-500">Delete this scheme?</span>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="rounded-md border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-red-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-60"
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
