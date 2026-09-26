"use client";

import { useActionState, useMemo, useState } from "react";
import { createProject } from "@/lib/actions/projects";
import {
  PROJECT_TYPES,
  PROJECT_TYPE_LABELS,
  MAX_PROJECT_MEMBERS,
} from "@/lib/rubric";
import type { ActionResult } from "@/lib/actions/sessions";

const initialState: ActionResult = {};

type Option = { id: string; label: string };

export function CreateProjectForm({
  sessions,
  weightSchemes,
  students,
  faculty,
  isCoordinator,
}: {
  sessions: Option[];
  weightSchemes: (Option & { isDefault: boolean })[];
  students: (Option & { rollNumber: string })[];
  faculty: Option[];
  isCoordinator: boolean;
}) {
  const [state, formAction, isPending] = useActionState(
    createProject,
    initialState,
  );
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const defaultSchemeId = useMemo(
    () => weightSchemes.find((s) => s.isDefault)?.id ?? weightSchemes[0]?.id,
    [weightSchemes],
  );

  function toggleStudent(id: string) {
    setSelectedStudentIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= MAX_PROJECT_MEMBERS) return prev;
      return [...prev, id];
    });
  }

  return (
    <form
      action={formAction}
      className="flex flex-col gap-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      {state.error && (
        <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="title" className="text-sm font-medium text-slate-700">
          Project title
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          placeholder="AI-Based Attendance System"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="description"
          className="text-sm font-medium text-slate-700"
        >
          Description (optional)
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          placeholder="Short summary of the project"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="type" className="text-sm font-medium text-slate-700">
            Project type
          </label>
          <select
            id="type"
            name="type"
            required
            defaultValue=""
            className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          >
            <option value="" disabled>
              Choose a type
            </option>
            {PROJECT_TYPES.map((type) => (
              <option key={type} value={type}>
                {PROJECT_TYPE_LABELS[type]}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="academicSessionId"
            className="text-sm font-medium text-slate-700"
          >
            Academic session
          </label>
          <select
            id="academicSessionId"
            name="academicSessionId"
            required
            defaultValue=""
            className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          >
            <option value="" disabled>
              Choose a session
            </option>
            {sessions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
          {sessions.length === 0 && (
            <p className="text-xs text-amber-600">
              No academic sessions exist yet. Ask the coordinator to create
              one first.
            </p>
          )}
        </div>
      </div>

      {isCoordinator && (
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="supervisorId"
            className="text-sm font-medium text-slate-700"
          >
            Supervisor (faculty)
          </label>
          <select
            id="supervisorId"
            name="supervisorId"
            required
            defaultValue=""
            className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          >
            <option value="" disabled>
              Choose a faculty member
            </option>
            {faculty.map((f) => (
              <option key={f.id} value={f.id}>
                {f.label}
              </option>
            ))}
          </select>
          {faculty.length === 0 && (
            <p className="text-xs text-amber-600">
              No faculty accounts exist yet. Create one under Faculty first.
            </p>
          )}
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="weightSchemeId" className="text-sm font-medium text-slate-700">
          Weight scheme
        </label>
        <select
          id="weightSchemeId"
          name="weightSchemeId"
          required
          defaultValue={defaultSchemeId ?? ""}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
        >
          <option value="" disabled>
            Choose a weight scheme
          </option>
          {weightSchemes.map((scheme) => (
            <option key={scheme.id} value={scheme.id}>
              {scheme.label}
              {scheme.isDefault ? " (default)" : ""}
            </option>
          ))}
        </select>
        {weightSchemes.length === 0 && (
          <p className="text-xs text-amber-600">
            No weight schemes exist yet. Ask the coordinator to create one
            first.
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-slate-700">
          Students ({selectedStudentIds.length}/{MAX_PROJECT_MEMBERS})
        </span>
        <div className="max-h-56 overflow-y-auto rounded-md border border-slate-300">
          {students.length === 0 && (
            <p className="px-3 py-3 text-sm text-slate-400">
              No students exist yet. Ask the coordinator to add some first.
            </p>
          )}
          {students.map((student) => {
            const checked = selectedStudentIds.includes(student.id);
            const disabled =
              !checked && selectedStudentIds.length >= MAX_PROJECT_MEMBERS;
            return (
              <label
                key={student.id}
                className={`flex items-center gap-3 border-b border-slate-100 px-3 py-2 text-sm last:border-b-0 ${
                  disabled ? "opacity-40" : "cursor-pointer hover:bg-slate-50"
                }`}
              >
                <input
                  type="checkbox"
                  name="studentIds"
                  value={student.id}
                  checked={checked}
                  disabled={disabled}
                  onChange={() => toggleStudent(student.id)}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-slate-900">{student.label}</span>
                <span className="text-xs text-slate-400">
                  {student.rollNumber}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="self-start rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Creating…" : "Create project"}
      </button>
    </form>
  );
}
