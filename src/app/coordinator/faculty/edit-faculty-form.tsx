"use client";

import { useActionState, useState } from "react";
import { updateFacultyAccount } from "@/lib/actions/faculty";
import type { ActionResult } from "@/lib/actions/sessions";

const initialState: ActionResult = {};

function generatePassword(): string {
  const chars =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  const bytes = new Uint32Array(12);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
}

export function EditFacultyForm({
  facultyId,
  name,
  email,
}: {
  facultyId: string;
  name: string;
  email: string;
}) {
  const [state, formAction, isPending] = useActionState(
    updateFacultyAccount,
    initialState,
  );
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form
      action={formAction}
      className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <input type="hidden" name="facultyId" value={facultyId} />

      {state.error && (
        <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </div>
      )}
      {state.success && (
        <div className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
          Saved.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="name" className="text-sm font-medium text-slate-700">
            Full name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            defaultValue={name}
            className="field-input text-sm"
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
            defaultValue={email}
            className="field-input text-sm"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm font-medium text-slate-700">
          Reset password (optional)
        </label>
        <div className="flex flex-wrap gap-2">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Leave blank to keep current password"
            className="field-input min-w-0 flex-1 text-sm"
          />
          <button
            type="button"
            onClick={() => {
              setPassword(generatePassword());
              setShowPassword(true);
            }}
            className="btn-outline whitespace-nowrap text-sm"
          >
            Generate
          </button>
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="btn-outline whitespace-nowrap text-sm"
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>
        {password && (
          <p className="text-xs text-amber-600">
            Share this new password with the faculty member directly &mdash;
            it will not be shown again after you save.
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="btn-solid-primary self-start text-sm"
      >
        {isPending ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
