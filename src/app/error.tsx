"use client";

// Error boundaries must be Client Components. Note: this Next.js version's
// error.tsx receives a `retry` callback, not the `reset` prop from older
// Next.js docs/training data (see AGENTS.md at the repo root, and
// node_modules/next/dist/docs/01-app/01-getting-started/10-error-handling.md).
import { useEffect } from "react";

export default function ErrorPage({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    // In production this is a good place to send the error to a logging
    // service; for now it just goes to the server console so it shows up
    // in Vercel's function logs.
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-1 flex-col items-center justify-center bg-slate-50 px-4 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-red-600 text-lg font-bold text-white">
        PO
      </div>
      <p className="mt-6 text-sm font-semibold uppercase tracking-wide text-red-600">
        Something went wrong
      </p>
      <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
        An unexpected error occurred
      </h1>
      <p className="mt-2 max-w-sm text-sm text-slate-600">
        This has been logged. You can try again, or head back to your
        dashboard.
      </p>
      <div className="mt-6 flex items-center gap-3">
        <button type="button" onClick={() => retry()} className="btn-outline text-sm">
          Try again
        </button>
        <a href="/dashboard" className="btn-solid-primary text-sm">
          Back to dashboard
        </a>
      </div>
    </div>
  );
}
