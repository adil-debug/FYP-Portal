import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { CreateProjectForm } from "./create-project-form";

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

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-6 py-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          New project
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          {user.role === "COORDINATOR"
            ? "Create a project and assign it to a faculty supervisor."
            : "Create a new project. You'll be the supervisor."}
        </p>
      </div>

      <CreateProjectForm
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
      />
    </div>
  );
}
