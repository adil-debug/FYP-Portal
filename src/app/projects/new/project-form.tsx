"use client";

import { useActionState, useMemo, useState } from "react";
import { createProject, updateProject } from "@/lib/actions/projects";
import {
  PROJECT_TYPES,
  PROJECT_TYPE_LABELS,
  MAX_PROJECT_MEMBERS,
} from "@/lib/rubric";
import type { ActionResult } from "@/lib/actions/sessions";

const initialState: ActionResult = {};

type Option = { id: string; label: string };

type Mode =
  | { kind: "create" }
  | {
      kind: "edit";
      projectId: string;
      project: {
        title: string;
        description: string | null;
        type: (typeof PROJECT_TYPES)[number];
        academicSessionId: string;
        supervisorId: string;
        weightSchemeId: string;
        studentIds: string[];
      };
    };

export function ProjectForm({
  mode,
  sessions,
  weightSchemes,
  students,
  faculty,
  isCoordinator,
}: {
  mode: Mode;
  sessions: Option[];
  weightSchemes: (Option & { isDefault: boolean })[];
  students: (Option & { rollNumber: string })[];
  faculty: Option[];
  isCoordinator: boolean;
}) {
  const action = mode.kind === "create" ? createProject : updateProject;
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>(
    mode.kind === "edit" ? mode.project.studentIds : [],
  );
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

  const isEdit = mode.kind === "edit";
  // Only a coordinator may change supervisor/session; on create, faculty
  // never see the supervisor field at all. On edit, faculty see both
  // fields as read-only context so they know who/where the project is.
  const canChangeAssignment = isCoordinator;

  return (
    <form
      action={formAction}
      className="flex flex-col gap-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      {isEdit && (
        <input type="hidden" name="projectId" value={mode.projectId} />
      )}

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
          defaultValue={isEdit ? mode.project.title : undefined}
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
          defaultValue={isEdit ? mode.project.description ?? "" : undefined}
          placeholder="Short summary of the project"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="type" className="text-sm font-medium text-slate-700">
            Project type
          </label>
          {isEdit ? (
            <p className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
              {PROJECT_TYPE_LABELS[mode.project.type]}{" "}
              <span className="text-xs text-slate-400">
                (can&apos;t be changed after creation — phase checklist
                depends on it)
              </span>
            </p>
          ) : (
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
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="academicSessionId"
            className="text-sm font-medium text-slate-700"
          >
            Academic session
          </label>
          {isEdit && !canChangeAssignment ? (
            <p className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
              {sessions.find((s) => s.id === mode.project.academicSessionId)
                ?.label ?? "—"}{" "}
              <span className="text-xs text-slate-400">
                (only a coordinator can move a project between sessions)
              </span>
            </p>
          ) : (
            <select
              id="academicSessionId"
              name="academicSessionId"
              required
              defaultValue={isEdit ? mode.project.academicSessionId : ""}
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
          )}
          {sessions.length === 0 && (
            <p className="text-xs text-amber-600">
              No academic sessions exist yet. Ask the coordinator to create
              one first.
            </p>
          )}
        </div>
      </div>

      {(isCoordinator || isEdit) && (
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="supervisorId"
            className="text-sm font-medium text-slate-700"
          >
            Supervisor (faculty)
          </label>
          {canChangeAssignment ? (
            <select
              id="supervisorId"
              name="supervisorId"
              required
              defaultValue={isEdit ? mode.project.supervisorId : ""}
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
          ) : (
            <p className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
              {faculty.find((f) => f.id === (isEdit ? mode.project.supervisorId : ""))
                ?.label ?? "You"}{" "}
              <span className="text-xs text-slate-400">
                (only a coordinator can reassign the supervisor)
              </span>
            </p>
          )}
          {canChangeAssignment && faculty.length === 0 && (
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
          defaultValue={isEdit ? mode.project.weightSchemeId : defaultSchemeId ?? ""}
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
        {isPending
          ? isEdit
            ? "Saving…"
            : "Creating…"
          : isEdit
            ? "Save changes"
            : "Create project"}
      </button>
    </form>
  );
}
