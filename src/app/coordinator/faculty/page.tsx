import { prisma } from "@/lib/prisma";
import { CreateFacultyForm } from "./create-faculty-form";
import { FacultyTable } from "./faculty-table";

export default async function FacultyPage() {
  const faculty = await prisma.user.findMany({
    where: { role: "FACULTY" },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { supervisedProjects: true } } },
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Faculty
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Create login accounts for faculty who will supervise and mark
          projects.
        </p>
      </div>

      <CreateFacultyForm />

      <FacultyTable
        faculty={faculty.map((member) => ({
          id: member.id,
          name: member.name,
          email: member.email,
          supervisedCount: member._count.supervisedProjects,
          createdAtLabel: member.createdAt.toLocaleDateString(),
        }))}
      />
    </div>
  );
}
