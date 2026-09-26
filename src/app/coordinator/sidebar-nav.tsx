"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType, SVGProps } from "react";
import {
  OverviewIcon,
  ProjectsIcon,
  MarksIcon,
  AwardIcon,
  SessionsIcon,
  FacultyIcon,
  StudentsIcon,
  WeightSchemesIcon,
} from "@/components/icons";

const NAV_ITEMS: {
  href: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
}[] = [
  { href: "/coordinator", label: "Overview", icon: OverviewIcon },
  { href: "/coordinator/projects", label: "Projects", icon: ProjectsIcon },
  { href: "/coordinator/marks-overview", label: "Marks Overview", icon: MarksIcon },
  { href: "/coordinator/award-list", label: "Award List", icon: AwardIcon },
  { href: "/coordinator/sessions", label: "Academic Sessions", icon: SessionsIcon },
  { href: "/coordinator/faculty", label: "Faculty", icon: FacultyIcon },
  { href: "/coordinator/students", label: "Students", icon: StudentsIcon },
  { href: "/coordinator/weight-schemes", label: "Weight Schemes", icon: WeightSchemesIcon },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <ul className="flex gap-1 overflow-x-auto pb-1 lg:flex-col lg:gap-0.5 lg:overflow-visible lg:pb-0">
      {NAV_ITEMS.map((item) => {
        // "/coordinator" itself must match exactly (otherwise it'd stay
        // highlighted on every /coordinator/* sub-page too).
        const isActive =
          item.href === "/coordinator"
            ? pathname === "/coordinator"
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;
        return (
          <li key={item.href} className="shrink-0 lg:shrink">
            <Link
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={`flex items-center gap-2.5 whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-indigo-500/15 text-white"
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-100"
              }`}
            >
              <Icon
                className={`h-4 w-4 shrink-0 ${
                  isActive ? "text-indigo-400" : "text-slate-500"
                }`}
              />
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
