import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";

export default async function FacultyAwardListPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  if (user.role === "COORDINATOR") {
    redirect("/coordinator/award-list");
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8 sm:px-6 sm:py-10">
      <div>
        <Link
          href="/dashboard"
          className="text-sm font-medium text-slate-500 hover:text-slate-700"
        >
          &larr; Back to dashboard
        </Link>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
          Award list
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Download a CSV of marks for every student across the projects you
          supervise, covering both semesters and all 5 rubric components.
        </p>
      </div>

      <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <a
          href="/api/award-list/faculty"
          download
          className="self-start rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700"
        >
          Download CSV
        </a>
        <p className="text-xs text-slate-500">
          Only your own supervised students are included. Cells for
          components that haven&apos;t been marked yet are left blank.
        </p>
      </div>
    </div>
  );
}
