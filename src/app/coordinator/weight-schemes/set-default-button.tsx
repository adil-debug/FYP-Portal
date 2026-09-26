"use client";

import { useTransition } from "react";
import { setDefaultWeightScheme } from "@/lib/actions/weight-schemes";

export function SetDefaultButton({
  schemeId,
  isDefault,
}: {
  schemeId: string;
  isDefault: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  if (isDefault) {
    return (
      <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
        Default
      </span>
    );
  }

  return (
    <button
      onClick={() => startTransition(() => setDefaultWeightScheme(schemeId))}
      disabled={isPending}
      className="rounded-full border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-60"
    >
      {isPending ? "Setting…" : "Make default"}
    </button>
  );
}
