"use client";

import { useActionState, useEffect, useRef } from "react";
import { createAcademicSession, type ActionResult } from "@/lib/actions/sessions";

const initialState: ActionResult = {};

export function CreateSessionForm() {
  const [state, formAction, isPending] = useActionState(
    createAcademicSession,
    initialState,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
    }
  }, [state.success]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-end"
    >
      <div className="flex flex-1 flex-col gap-1.5">
        <label htmlFor="title" className="text-sm font-medium text-slate-700">
          New academic session
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          placeholder="e.g. 2025-2026"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
        />
        {state.error && (
          <p className="text-sm text-red-600">{state.error}</p>
        )}
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Creating…" : "Create session"}
      </button>
    </form>
  );
}
