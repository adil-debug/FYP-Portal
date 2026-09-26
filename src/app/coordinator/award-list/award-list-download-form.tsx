"use client";

import { useState } from "react";

export function AwardListDownloadForm({
  sessions,
}: {
  sessions: { id: string; title: string }[];
}) {
  const [sessionId, setSessionId] = useState("all");

  const href = `/api/award-list/coordinator?sessionId=${encodeURIComponent(sessionId)}`;

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-1.5 sm:max-w-xs">
        <label htmlFor="sessionId" className="text-sm font-medium text-slate-700">
          Academic session
        </label>
        <select
          id="sessionId"
          value={sessionId}
          onChange={(e) => setSessionId(e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition-colors hover:border-indigo-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
        >
          <option value="all">All sessions</option>
          {sessions.map((s) => (
            <option key={s.id} value={s.id}>
              {s.title}
            </option>
          ))}
        </select>
      </div>

      <a
        href={href}
        download
        className="self-start rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700"
      >
        Download CSV
      </a>

      <p className="text-xs text-slate-500">
        The CSV has one row per student, with a column for every rubric
        component in both FYP-I and FYP-II, plus semester and grand totals.
        Cells for components that haven&apos;t been marked yet are left
        blank.
      </p>
    </div>
  );
}
