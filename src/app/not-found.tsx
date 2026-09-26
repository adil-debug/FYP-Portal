import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-1 flex-col items-center justify-center bg-slate-50 px-4 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-indigo-600 text-lg font-bold text-white">
        PO
      </div>
      <p className="mt-6 text-sm font-semibold uppercase tracking-wide text-indigo-600">
        404
      </p>
      <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
        Page not found
      </h1>
      <p className="mt-2 max-w-sm text-sm text-slate-600">
        The page you&apos;re looking for doesn&apos;t exist, or you may not
        have access to it.
      </p>
      <Link href="/dashboard" className="btn-solid-primary mt-6 text-sm">
        Back to dashboard
      </Link>
    </div>
  );
}
