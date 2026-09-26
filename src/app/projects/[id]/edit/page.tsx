import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { ProjectForm } from "@/app/projects/new/project-form";

export default async function EditProjectPage(
  props: PageProps<"/projects/[id]/edit">,
) {
  const { id } = await props.params;
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const project = await prisma.project.findUnique({
    where: { id },
    include: { members: { select: { studentId: true } } },
  });
  if (!project) {
    notFound();
  }

  const canEdit =
    user.role === "COORDINATOR" || project.supervisorId === user.userId;
  if (!canEdit) {
    redirect(user.role === "COORDINATOR" ? "/coordinator/projects" : "/dashboard");
  }

  const [sessions, weightSchemes, students, faculty] = await Promise.all([
    prisma.academicSession.findMany({
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
      : prisma.user.findMany({
          where: { id: project.supervisorId },
          select: { id: true, name: true, email: true },
        }),
  ]);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8 sm:px-6 sm:py-10">
      <div>
        <Link
          href={`/projects/${project.id}`}
          className="text-sm font-medium text-slate-500 hover:text-slate-700"
        >
          &larr; Back
        </Link>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
          Edit project
        </h1>
        <p className="mt-1 text-sm text-slate-600">{project.title}</p>
      </div>

      <ProjectForm
        mode={{
          kind: "edit",
          projectId: project.id,
          project: {
            title: project.title,
            description: project.description,
            type: project.type,
            academicSessionId: project.academicSessionId,
            supervisorId: project.supervisorId,
            weightSchemeId: project.weightSchemeId,
            studentIds: project.members.map((m) => m.studentId),
          },
        }}
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
        cancelHref={`/projects/${project.id}`}
      />
    </div>
  );
}
