import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { LogoutButton } from "@/app/dashboard/logout-button";

const NAV_ITEMS = [
  { href: "/coordinator", label: "Overview" },
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
              <p className="text-xs text-slate-500">FYP Coordinator</p>
            </div>
            <LogoutButton />
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-6xl flex-1 gap-8 px-6 py-8">
        <nav className="w-56 shrink-0">
          <ul className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="block rounded-md px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-white hover:text-slate-900"
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
