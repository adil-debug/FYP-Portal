"use client";

import { useActionState, useEffect, useRef } from "react";
import { changeOwnPassword } from "@/lib/actions/account";
import type { ActionResult } from "@/lib/actions/sessions";

const initialState: ActionResult = {};

export function ChangePasswordForm() {
  const [state, formAction, isPending] = useActionState(
    changeOwnPassword,
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
      {state.success && (
        <div className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
          Password changed.
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="currentPassword"
          className="text-sm font-medium text-slate-700"
        >
          Current password
        </label>
        <input
          id="currentPassword"
          name="currentPassword"
          type="password"
          required
          autoComplete="current-password"
          className="field-input text-sm"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="newPassword"
          className="text-sm font-medium text-slate-700"
        >
          New password
        </label>
        <input
          id="newPassword"
          name="newPassword"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="field-input text-sm"
        />
        <p className="text-xs text-slate-400">At least 8 characters.</p>
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="confirmPassword"
          className="text-sm font-medium text-slate-700"
        >
          Confirm new password
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="field-input text-sm"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="btn-solid-primary self-start text-sm"
      >
        {isPending ? "Changing…" : "Change password"}
      </button>
    </form>
  );
}
