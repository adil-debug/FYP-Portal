"use client";

import { useTransition } from "react";
import { toggleAcademicSessionActive } from "@/lib/actions/sessions";

export function ToggleActiveButton({
  sessionId,
  isActive,
}: {
  sessionId: string;
  isActive: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      onClick={() =>
        startTransition(() => {
          toggleAcademicSessionActive(sessionId, !isActive);
        })
      }
      disabled={isPending}
      className={`rounded-full px-2.5 py-1 text-xs font-semibold transition-colors disabled:opacity-60 ${
        isActive
          ? "bg-green-50 text-green-700 hover:bg-green-100"
          : "bg-slate-100 text-slate-500 hover:bg-slate-200"
      }`}
    >
      {isActive ? "Active" : "Inactive"}
    </button>
  );
}
