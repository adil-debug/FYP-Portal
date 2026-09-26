import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { LogoutButton } from "@/app/dashboard/logout-button";
import { SidebarNav } from "./sidebar-nav";

export default async function CoordinatorLayout({
  children,
}: LayoutProps<"/coordinator">) {
  const user = await getCurrentUser();

  // Defense in depth: proxy.ts already restricts /coordinator/* to
  // COORDINATOR sessions, but this layout checks again rather than
  // trusting proxy alone (see src/lib/session.ts).
  if (!user) {
    redirect("/login");
  }
  if (user.role !== "COORDINATOR") {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-1 flex-col bg-slate-50 lg:flex-row">
      {/*
        Desktop: a fixed-width dark sidebar for the full viewport height.
        Mobile/tablet: the same panel collapses into a dark top strip with
        a horizontally-scrolling nav, so the whole nav stays one visually
        consistent dark surface instead of switching to a white bar.
      */}
      <aside className="flex shrink-0 flex-col bg-slate-900 lg:h-screen lg:w-64 lg:sticky lg:top-0">
        <div className="flex items-center gap-2.5 px-4 py-4 sm:px-6 lg:px-5 lg:py-5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-500 text-sm font-bold text-white">
            PO
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold tracking-tight text-white">
              Project Oversight
            </p>
            <p className="text-xs text-slate-400">Coordinator console</p>
          </div>
        </div>

        <nav className="border-t border-white/10 px-2 py-3 lg:flex-1 lg:overflow-y-auto lg:px-3 lg:py-4">
          <SidebarNav />
        </nav>

        <div className="mt-auto hidden border-t border-white/10 px-4 py-4 lg:block">
          <p className="truncate text-sm font-medium text-white">{user.name}</p>
          <p className="text-xs text-slate-400">FYP Coordinator</p>
          <div className="mt-3 flex flex-col gap-1.5">
            <Link
              href="/account/change-password"
              className="rounded-md px-2.5 py-1.5 text-left text-xs font-medium text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
            >
              Change password
            </Link>
            <LogoutButton className="rounded-md px-2.5 py-1.5 text-left text-xs font-medium text-slate-300 transition-colors hover:bg-white/5 hover:text-white" />
          </div>
        </div>
      </aside>

      {/* On mobile, user info/actions move into a compact header above the
          content, since the sidebar-turned-top-strip has no room for them. */}
      <header className="flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3 sm:px-6 lg:hidden">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-slate-900">{user.name}</p>
          <p className="text-xs text-slate-500">FYP Coordinator</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Link href="/account/change-password" className="btn-outline text-sm">
            Change password
          </Link>
          <LogoutButton />
        </div>
      </header>

      <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10">
        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
