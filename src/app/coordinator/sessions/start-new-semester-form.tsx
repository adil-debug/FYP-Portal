"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { startNewSemester } from "@/lib/actions/sessions";
import type { ActionResult } from "@/lib/actions/sessions";

const initialState: ActionResult = {};

/**
 * "Start new semester" rollover: creates a new academic session and clones
 * the current default weight scheme's component weights as a starting
 * point for the new session. Deliberately does not touch projects or
 * students — those are created fresh for the new semester. Collapsed
 * behind a toggle by default so it doesn't compete visually with the
 * plain "create session" form above it.
 */
export function StartNewSemesterForm() {
  const [expanded, setExpanded] = useState(false);
  const [state, formAction, isPending] = useActionState(
    startNewSemester,
    initialState,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
    }
  }, [state.success]);

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="btn-outline w-fit text-sm"
      >
        Start new semester…
      </button>
    );
  }

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex flex-col gap-3 rounded-xl border border-indigo-200 bg-indigo-50 p-5 shadow-sm sm:flex-row sm:items-end"
    >
      <div className="flex flex-1 flex-col gap-1.5">
        <label htmlFor="rollover-title" className="text-sm font-medium text-slate-700">
          Start new semester
        </label>
        <input
          id="rollover-title"
          name="title"
          type="text"
          required
          placeholder="e.g. 2026-2027"
          className="field-input text-sm"
        />
        <p className="text-xs text-slate-600">
          Creates a new academic session and clones the current default
          weight scheme as a starting point. Projects and students are not
          copied — the new semester starts empty.
        </p>
        {state.error && <p className="text-sm text-amber-700">{state.error}</p>}
        {state.success && !state.error && (
          <p className="text-sm text-emerald-700">New semester created.</p>
        )}
      </div>
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="btn-solid-primary text-sm"
        >
          {isPending ? "Creating…" : "Create new semester"}
        </button>
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="btn-outline text-sm"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
