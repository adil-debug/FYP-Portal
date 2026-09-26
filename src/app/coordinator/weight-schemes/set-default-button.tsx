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
      className="btn-outline rounded-full px-2.5 py-1 text-xs"
    >
      {isPending ? "Setting…" : "Make default"}
    </button>
  );
}
