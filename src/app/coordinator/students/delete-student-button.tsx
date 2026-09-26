"use client";

import { useActionState, useState } from "react";
import { deleteStudent } from "@/lib/actions/students";
import type { ActionResult } from "@/lib/actions/sessions";

const initialState: ActionResult = {};

export function DeleteStudentButton({ studentId }: { studentId: string }) {
  const [confirming, setConfirming] = useState(false);
  const [state, formAction, isPending] = useActionState(
    deleteStudent,
    initialState,
  );

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="text-xs font-medium text-red-500 hover:text-red-700"
      >
        Delete
      </button>
    );
  }

  return (
    <form action={formAction} className="flex flex-col items-end gap-1">
      <input type="hidden" name="studentId" value={studentId} />
      <div className="flex items-center gap-1.5 whitespace-nowrap">
        <span className="text-xs text-slate-500">Delete?</span>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="btn-outline px-2 py-1 text-xs"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="btn-solid-danger px-2 py-1 text-xs"
        >
          {isPending ? "Deleting…" : "Yes"}
        </button>
      </div>
      {state.error && (
        <p className="max-w-[16rem] text-right text-xs font-medium text-red-600">
          {state.error}
        </p>
      )}
    </form>
  );
}
