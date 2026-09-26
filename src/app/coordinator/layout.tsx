import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { LogoutButton } from "@/app/dashboard/logout-button";

const NAV_ITEMS = [
  { href: "/coordinator", label: "Overview" },
  { href: "/coordinator/projects", label: "Projects" },
  { href: "/coordinator/marks-overview", label: "Marks Overview" },
  { href: "/coordinator/award-list", label: "Award List" },
  { href: "/coordinator/sessions", label: "Academic Sessions" },
  { href: "/coordinator/faculty", label: "Faculty" },
  { href: "/coordinator/students", label: "Students" },
  { href: "/coordinator/weight-schemes", label: "Weight Schemes" },
];

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
    <div className="flex min-h-screen flex-1 flex-col bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
              PO
            </div>
            <span className="truncate text-base font-semibold tracking-tight text-slate-900 sm:text-lg">
              Project Oversight Portal
            </span>
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="min-w-0 text-right">
              <p className="truncate text-sm font-medium text-slate-900">
                {user.name}
              </p>
              <p className="text-xs text-slate-500">FYP Coordinator</p>
            </div>
            <Link
              href="/account/change-password"
              className="btn-outline text-sm"
            >
              Change password
            </Link>
            <LogoutButton />
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 px-4 py-6 sm:gap-8 sm:px-6 sm:py-8 lg:flex-row">
        <nav className="shrink-0 lg:w-56">
          <ul className="flex gap-1 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
            {NAV_ITEMS.map((item) => (
              <li key={item.href} className="shrink-0 lg:shrink">
                <Link
                  href={item.href}
                  className="block whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-white hover:text-slate-900"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
