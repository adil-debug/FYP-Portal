"use client";

import { useActionState, useEffect, useRef } from "react";
import { createStudent } from "@/lib/actions/students";
import type { ActionResult } from "@/lib/actions/sessions";

const initialState: ActionResult = {};

export function CreateStudentForm() {
  const [state, formAction, isPending] = useActionState(
    createStudent,
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
      className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      {state.error && (
        <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="name" className="text-sm font-medium text-slate-700">
            Full name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            placeholder="Ali Ahmed"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="rollNumber"
            className="text-sm font-medium text-slate-700"
          >
            Roll number
          </label>
          <input
            id="rollNumber"
            name="rollNumber"
            type="text"
            required
            placeholder="BSCS-21-001"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-sm font-medium text-slate-700">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            placeholder="ali.ahmed@student.edu"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="self-start rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Adding…" : "Add student"}
      </button>
    </form>
  );
}
