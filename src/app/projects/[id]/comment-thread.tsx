"use client";

import { useActionState, useRef } from "react";
import { createProjectComment } from "@/lib/actions/comments";
import type { ActionResult } from "@/lib/actions/sessions";

const initialState: ActionResult = {};

export type CommentEntry = {
  id: string;
  body: string;
  createdAt: string;
  authorName: string;
  authorRole: "COORDINATOR" | "FACULTY";
};

/**
 * Coordinator ↔ supervising-faculty discussion thread for a project.
 * Rendered only when the caller has already verified access (the project
 * detail page checks canView == coordinator-or-supervisor before mounting
 * this at all), and every write re-checks access again server-side in
 * createProjectComment, so this component adds no authorization of its
 * own — it's a presentation layer over an already-guarded action.
 */
export function CommentThread({
  projectId,
  comments,
}: {
  projectId: string;
  comments: CommentEntry[];
}) {
  const [state, formAction, isPending] = useActionState(
    createProjectComment,
    initialState,
  );
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-4 py-3">
        <h2 className="font-semibold text-slate-900">Comments</h2>
        <p className="text-xs text-slate-500">
          Visible only to the coordinator and this project&apos;s supervisor.
        </p>
      </div>

      <ul className="max-h-96 divide-y divide-slate-100 overflow-y-auto">
        {comments.length === 0 && (
          <li className="px-4 py-6 text-center text-sm text-slate-400">
            No comments yet.
          </li>
        )}
        {comments.map((comment) => (
          <li key={comment.id} className="px-4 py-3">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-sm font-medium text-slate-900">
                {comment.authorName}{" "}
                <span className="text-xs font-normal text-slate-400">
                  ({comment.authorRole === "COORDINATOR" ? "Coordinator" : "Faculty"})
                </span>
              </span>
              <span className="whitespace-nowrap text-xs text-slate-400">
                {comment.createdAt}
              </span>
            </div>
            <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">
              {comment.body}
            </p>
          </li>
        ))}
      </ul>

      <form
        ref={formRef}
        action={async (formData) => {
          await formAction(formData);
          formRef.current?.reset();
        }}
        className="flex flex-col gap-2 border-t border-slate-200 p-4"
      >
        <input type="hidden" name="projectId" value={projectId} />
        {state.error && (
          <p className="text-sm text-red-600">{state.error}</p>
        )}
        <textarea
          name="body"
          rows={2}
          required
          placeholder="Add a comment…"
          className="field-input text-sm"
        />
        <button
          type="submit"
          disabled={isPending}
          className="btn-solid-primary w-fit text-sm"
        >
          {isPending ? "Posting…" : "Post comment"}
        </button>
      </form>
    </div>
  );
}
