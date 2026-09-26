"use client";

import { useActionState } from "react";
import { deleteProjectComment } from "@/lib/actions/comments";
import type { ActionResult } from "@/lib/actions/sessions";

const initialState: ActionResult = {};

/**
 * Small "Delete" action on a single comment. Only rendered by the parent
 * for a comment the current viewer is allowed to delete (their own
 * comment, or any comment if they're the coordinator) — but the server
 * action re-checks that same rule independently, so this button is a
 * convenience, not the real access control.
 */
export function DeleteCommentButton({ commentId }: { commentId: string }) {
  const [state, formAction, isPending] = useActionState(
    deleteProjectComment,
    initialState,
  );

  return (
    <form action={formAction} className="inline">
      <input type="hidden" name="commentId" value={commentId} />
      <button
        type="submit"
        disabled={isPending}
        className="text-xs font-medium text-slate-400 hover:text-red-600"
        title="Delete comment"
      >
        {isPending ? "Deleting…" : "Delete"}
      </button>
      {state.error && (
        <span className="ml-2 text-xs text-red-600">{state.error}</span>
      )}
    </form>
  );
}
