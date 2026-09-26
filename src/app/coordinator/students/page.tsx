import { prisma } from "@/lib/prisma";
import { CreateStudentForm } from "./create-student-form";

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

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Roll number</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Projects</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {students.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                  No students yet. Add one above.
                </td>
              </tr>
            )}
            {students.map((student) => (
              <tr key={student.id}>
                <td className="px-4 py-3 font-medium text-slate-900">
                  {student.name}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {student.rollNumber}
                </td>
                <td className="px-4 py-3 text-slate-600">{student.email}</td>
                <td className="px-4 py-3 text-slate-600">
                  {student._count.memberships}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
