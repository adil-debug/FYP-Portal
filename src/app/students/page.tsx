import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { CreateStudentForm } from "@/app/coordinator/students/create-student-form";
import { StudentsTable } from "@/app/coordinator/students/students-table";

export default async function FacultyStudentsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  if (user.role === "COORDINATOR") {
    redirect("/coordinator/students");
  }

  const students = await prisma.student.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { memberships: true } } },
  });

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8 sm:px-6 sm:py-10">
      <div>
        <Link
          href="/dashboard"
          className="text-sm font-medium text-slate-500 hover:text-slate-700"
        >
          &larr; Back to dashboard
        </Link>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
          Students
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Students never log in &mdash; they only receive email updates about
          their marks. Add a student here so you (or the coordinator) can
          assign them to a project.
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
