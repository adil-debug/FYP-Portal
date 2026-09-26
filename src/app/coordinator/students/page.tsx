import { prisma } from "@/lib/prisma";
import { CreateStudentForm } from "./create-student-form";
import { StudentsTable } from "./students-table";

export default async function StudentsPage() {
  const students = await prisma.student.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { memberships: true } } },
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Students
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Students never log in &mdash; they only receive email updates about
          their marks. Add them here so they can be assigned to projects.
        </p>
      </div>

      <CreateStudentForm />

      <StudentsTable
        students={students.map((s) => ({
          id: s.id,
          name: s.name,
          rollNumber: s.rollNumber,
          email: s.email,
          projectCount: s._count.memberships,
        }))}
      />
    </div>
  );
}
