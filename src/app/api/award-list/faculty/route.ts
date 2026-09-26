import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { buildAwardListCsv, type AwardListRow } from "@/lib/award-list-csv";

/**
 * GET /api/award-list/faculty
 *
 * Any logged-in user can call this, but it only ever returns the caller's
 * own supervised projects (for a coordinator calling this route directly,
 * that's an empty CSV, since coordinators use /api/award-list/coordinator
 * instead) — the scoping is enforced by the `where: { supervisorId }`
 * query itself, not by trusting anything the client sends.
 */
export async function GET() {
  const user = await requireUser();

  const projects = await prisma.project.findMany({
    where: { supervisorId: user.userId },
    orderBy: { createdAt: "desc" },
    include: {
      academicSession: { select: { title: true } },
      supervisor: { select: { name: true } },
      members: { include: { student: true } },
      marks: {
        select: { studentId: true, semester: true, componentType: true, marksAwarded: true },
      },
    },
  });

  const rows: AwardListRow[] = [];
  for (const project of projects) {
    for (const member of project.members) {
      // A component can now have several Mark rows (one per week for
      // WEEKLY_MEETINGS, one per phase for SDLC_PHASE), so sum into the
      // component's single award-list column rather than overwriting.
      const marksByKey: Record<string, number | null> = {};
      for (const mark of project.marks.filter((m) => m.studentId === member.studentId)) {
        const key = `${mark.semester}_${mark.componentType}`;
        marksByKey[key] = (marksByKey[key] ?? 0) + Number(mark.marksAwarded);
      }
      rows.push({
        studentName: member.student.name,
        rollNumber: member.student.rollNumber,
        projectTitle: project.title,
        supervisorName: project.supervisor.name,
        academicSession: project.academicSession.title,
        marksByKey,
      });
    }
  }

  const csv = buildAwardListCsv(rows);

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="award-list-my-students.csv"`,
    },
  });
}
