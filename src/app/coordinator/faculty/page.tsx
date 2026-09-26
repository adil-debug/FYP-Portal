import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { CreateFacultyForm } from "./create-faculty-form";

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

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Supervised projects</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {faculty.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                  No faculty accounts yet. Create one above.
                </td>
              </tr>
            )}
            {faculty.map((member) => (
              <tr key={member.id}>
                <td className="px-4 py-3 font-medium text-slate-900">
                  {member.name}
                </td>
                <td className="px-4 py-3 text-slate-600">{member.email}</td>
                <td className="px-4 py-3 text-slate-600">
                  {member._count.supervisedProjects}
                </td>
                <td className="px-4 py-3 text-slate-500">
                  {member.createdAt.toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/coordinator/faculty/${member.id}`}
                    className="font-medium text-indigo-700 hover:underline"
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
