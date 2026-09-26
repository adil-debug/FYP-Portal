import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { ProjectForm } from "./project-form";

export default async function NewProjectPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const [sessions, weightSchemes, students, faculty] = await Promise.all([
    prisma.academicSession.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
      select: { id: true, title: true },
    }),
    prisma.weightScheme.findMany({
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
      select: { id: true, name: true, isDefault: true },
    }),
    prisma.student.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, rollNumber: true },
    }),
    user.role === "COORDINATOR"
      ? prisma.user.findMany({
          where: { role: "FACULTY" },
          orderBy: { name: "asc" },
          select: { id: true, name: true, email: true },
        })
      : Promise.resolve([]),
  ]);

  const backHref = user.role === "COORDINATOR" ? "/coordinator/projects" : "/dashboard";

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8 sm:px-6 sm:py-10">
      <div>
        <Link
          href={backHref}
          className="text-sm font-medium text-slate-500 hover:text-slate-700"
        >
          &larr; Back
        </Link>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
          New project
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          {user.role === "COORDINATOR"
            ? "Create a project and assign it to a faculty supervisor."
            : "Create a new project. You'll be the supervisor."}
        </p>
      </div>

      <ProjectForm
        mode={{ kind: "create" }}
        sessions={sessions.map((s) => ({ id: s.id, label: s.title }))}
        weightSchemes={weightSchemes.map((s) => ({
          id: s.id,
          label: s.name,
          isDefault: s.isDefault,
        }))}
        students={students.map((s) => ({
          id: s.id,
          label: s.name,
          rollNumber: s.rollNumber,
        }))}
        faculty={faculty.map((f) => ({ id: f.id, label: `${f.name} (${f.email})` }))}
        isCoordinator={user.role === "COORDINATOR"}
        cancelHref={backHref}
      />
    </div>
  );
}
