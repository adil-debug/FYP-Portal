import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { LogoutButton } from "./logout-button";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  // Defense in depth: proxy.ts should already have redirected an
  // unauthenticated request to /login, but this route checks its own
  // session too rather than trusting proxy alone.
  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen flex-1 flex-col bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
              PO
            </div>
            <span className="text-lg font-semibold tracking-tight text-slate-900">
              Project Oversight Portal
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-slate-900">{user.name}</p>
              <p className="text-xs text-slate-500">
                {user.role === "COORDINATOR" ? "FYP Coordinator" : "Faculty"}
              </p>
            </div>
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 px-6 py-12">
        <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-600 w-fit">
          Phase 3 · Authentication
        </span>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          You&apos;re signed in, {user.name.split(" ")[0]}.
        </h1>
        <p className="max-w-xl text-slate-600">
          This dashboard is a placeholder confirming login works end-to-end.
          The real coordinator/faculty dashboards (project lists, marks
          entry, phase tracking) are built in later phases.
        </p>
      </main>
    </div>
  );
}
