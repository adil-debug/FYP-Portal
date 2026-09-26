"use client";

import Link from "next/link";
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
        // ISO "YYYY-MM-DD" strings (or null), pre-formatted for an
        // <input type="date">'s defaultValue by the page component,
        // since that's the only string shape that input accepts.
        proposalDueAt: string | null;
        proposalSubmittedAt: string | null;
      };
    };

export function ProjectForm({
  mode,
  sessions,
  weightSchemes,
  students,
  faculty,
  isCoordinator,
  cancelHref,
}: {
  mode: Mode;
  sessions: Option[];
  weightSchemes: (Option & { isDefault: boolean })[];
  students: (Option & { rollNumber: string })[];
  faculty: Option[];
  isCoordinator: boolean;
  // Where "Cancel" sends the user — the project's own detail page when
  // editing, or the caller's project list when creating. Passed in by the
  // page rather than computed here, since the two callers (new vs. edit)
  // have different fallback destinations and only the page component
  // knows which one applies.
  cancelHref: string;
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

  // Shared classes: editable fields get a visible hover/focus affordance so
  // it's obvious they can be changed; locked (read-only) fields get a
  // deliberately flat, non-interactive look plus a small lock icon so the
  // difference from an editable field is visible at a glance, not just
  // implied by the caption text underneath.
  const fieldClass = "field-input text-sm";
  const lockedFieldClass =
    "flex items-center justify-between gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600";

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
          className={fieldClass}
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
          className={fieldClass}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="type" className="text-sm font-medium text-slate-700">
            Project type
          </label>
          {isEdit ? (
            <div className={lockedFieldClass} title="Can't be changed after creation">
              <span>
                {PROJECT_TYPE_LABELS[mode.project.type]}{" "}
                <span className="text-xs text-slate-400">
                  (locked — phase checklist depends on it)
                </span>
              </span>
              <LockIcon />
            </div>
          ) : (
            <select
              id="type"
              name="type"
              required
              defaultValue=""
              className={fieldClass}
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
            <div
              className={lockedFieldClass}
              title="Only a coordinator can move a project between sessions"
            >
              <span>
                {sessions.find((s) => s.id === mode.project.academicSessionId)
                  ?.label ?? "—"}{" "}
                <span className="text-xs text-slate-400">
                  (locked — coordinator only)
                </span>
              </span>
              <LockIcon />
            </div>
          ) : (
            <select
              id="academicSessionId"
              name="academicSessionId"
              required
              defaultValue={isEdit ? mode.project.academicSessionId : ""}
              className={fieldClass}
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

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="proposalDueAt"
            className="text-sm font-medium text-slate-700"
          >
            Proposal due date (optional)
          </label>
          <input
            id="proposalDueAt"
            name="proposalDueAt"
            type="date"
            defaultValue={isEdit ? mode.project.proposalDueAt ?? "" : ""}
            className={fieldClass}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="proposalSubmittedAt"
            className="text-sm font-medium text-slate-700"
          >
            Proposal submitted on (optional)
          </label>
          <input
            id="proposalSubmittedAt"
            name="proposalSubmittedAt"
            type="date"
            defaultValue={isEdit ? mode.project.proposalSubmittedAt ?? "" : ""}
            className={fieldClass}
          />
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
              className={fieldClass}
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
            <div
              className={lockedFieldClass}
              title="Only a coordinator can reassign the supervisor"
            >
              <span>
                {faculty.find((f) => f.id === (isEdit ? mode.project.supervisorId : ""))
                  ?.label ?? "You"}{" "}
                <span className="text-xs text-slate-400">
                  (locked — coordinator only)
                </span>
              </span>
              <LockIcon />
            </div>
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
          className={fieldClass}
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
        <div className="max-h-56 overflow-y-auto rounded-md border border-slate-300 transition-colors hover:border-indigo-400">
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

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="btn-solid-primary text-sm"
        >
          {isPending
            ? isEdit
              ? "Saving…"
              : "Creating…"
            : isEdit
              ? "Save changes"
              : "Create project"}
        </button>
        <Link href={cancelHref} className="btn-outline text-sm">
          Cancel
        </Link>
      </div>
    </form>
  );
}

function LockIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="currentColor"
      className="h-4 w-4 shrink-0 text-slate-400"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M10 1a4 4 0 00-4 4v2H5a2 2 0 00-2 2v7a2 2 0 002 2h10a2 2 0 002-2V9a2 2 0 00-2-2h-1V5a4 4 0 00-4-4zm2 6V5a2 2 0 10-4 0v2h4z"
        clipRule="evenodd"
      />
    </svg>
  );
}
