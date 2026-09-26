import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireCoordinator } from "@/lib/session";
import { EditFacultyForm } from "../edit-faculty-form";
import { DeleteFacultyButton } from "../delete-faculty-button";

export default async function EditFacultyPage(
  props: PageProps<"/coordinator/faculty/[id]">,
) {
  await requireCoordinator();
  const { id } = await props.params;

  const faculty = await prisma.user.findUnique({
    where: { id },
    include: { _count: { select: { supervisedProjects: true } } },
  });

  if (!faculty || faculty.role !== "FACULTY") {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/coordinator/faculty"
            className="text-sm font-medium text-slate-500 hover:text-slate-700"
          >
            &larr; Back to Faculty
          </Link>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            Edit faculty account
          </h1>
        </div>
        <DeleteFacultyButton
          facultyId={faculty.id}
          supervisedProjectCount={faculty._count.supervisedProjects}
        />
      </div>

      {faculty._count.supervisedProjects > 0 && (
        <p className="text-xs text-amber-600">
          This faculty member supervises {faculty._count.supervisedProjects}{" "}
          project(s) and can&apos;t be deleted until those are reassigned or
          removed.
        </p>
      )}

      <EditFacultyForm
        facultyId={faculty.id}
        name={faculty.name}
        email={faculty.email}
      />
    </div>
  );
}
