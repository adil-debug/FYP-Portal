import { prisma } from "@/lib/prisma";
import { CreateSessionForm } from "./create-session-form";
import { ToggleActiveButton } from "./toggle-active-button";

export default async function SessionsPage() {
  const sessions = await prisma.academicSession.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { projects: true } } },
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Academic Sessions
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Group projects by cohort, e.g. &quot;2025-2026&quot;. Every project
          belongs to one session.
        </p>
      </div>

      <CreateSessionForm />

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Projects</th>
              <th className="px-4 py-3">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sessions.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                  No academic sessions yet. Create one above.
                </td>
              </tr>
            )}
            {sessions.map((session) => (
              <tr key={session.id}>
                <td className="px-4 py-3 font-medium text-slate-900">
                  {session.title}
                </td>
                <td className="px-4 py-3">
                  <ToggleActiveButton
                    sessionId={session.id}
                    isActive={session.isActive}
                  />
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {session._count.projects}
                </td>
                <td className="px-4 py-3 text-slate-500">
                  {session.createdAt.toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
