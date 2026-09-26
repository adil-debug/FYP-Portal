import { prisma } from "@/lib/prisma";
import { AwardListDownloadForm } from "./award-list-download-form";

export default async function CoordinatorAwardListPage() {
  const sessions = await prisma.academicSession.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true },
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Award list
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Download a CSV of every student&apos;s marks across all
          components and both semesters, for all projects or a single
          academic session.
        </p>
      </div>

      <AwardListDownloadForm
        sessions={sessions.map((s) => ({ id: s.id, title: s.title }))}
      />
    </div>
  );
}
