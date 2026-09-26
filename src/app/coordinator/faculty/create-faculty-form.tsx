"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { createFacultyAccount } from "@/lib/actions/faculty";
import type { ActionResult } from "@/lib/actions/sessions";

const initialState: ActionResult = {};

function generatePassword(): string {
  const chars =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  const bytes = new Uint32Array(12);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
}

export function CreateFacultyForm() {
  const [state, formAction, isPending] = useActionState(
    createFacultyAccount,
    initialState,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [justCreatedPassword, setJustCreatedPassword] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (state.success) {
      setJustCreatedPassword(password);
      formRef.current?.reset();
      setPassword("");
    }
  }, [state.success]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-col gap-3">
      {justCreatedPassword && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Faculty account created. Share this password with them now &mdash;
          it will not be shown again:{" "}
          <code className="rounded bg-amber-100 px-1.5 py-0.5 font-mono">
            {justCreatedPassword}
          </code>
        </div>
      )}

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
              placeholder="Dr. Jane Doe"
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
              placeholder="jane.doe@university.edu"
              className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="text-sm font-medium text-slate-700">
            Initial password
          </label>
          <div className="flex gap-2">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
            <button
              type="button"
              onClick={() => {
                setPassword(generatePassword());
                setShowPassword(true);
              }}
              className="whitespace-nowrap rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Generate
            </button>
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="whitespace-nowrap rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
          <p className="text-xs text-slate-500">
            Share this with the faculty member directly. They are not emailed
            automatically (email notifications are added in a later phase).
          </p>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="self-start rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Creating…" : "Create faculty account"}
        </button>
      </form>
    </div>
  );
}
