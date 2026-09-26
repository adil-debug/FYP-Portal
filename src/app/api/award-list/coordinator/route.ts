import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCoordinator } from "@/lib/session";
import { buildAwardListCsv, type AwardListRow } from "@/lib/award-list-csv";

/**
 * GET /api/award-list/coordinator?sessionId=<id>|all
 *
 * Coordinator-only CSV download covering every project (optionally
 * filtered to one academic session). Re-checks the coordinator role here
 * even though the link only appears in the coordinator UI, since this is
 * a plain GET a tampered request could otherwise hit directly.
 */
export async function GET(request: NextRequest) {
  try {
    await requireCoordinator();
  } catch {
    return NextResponse.json({ error: "Coordinator access required." }, { status: 403 });
  }

  const sessionId = request.nextUrl.searchParams.get("sessionId") ?? "all";

  const projects = await prisma.project.findMany({
    where: sessionId === "all" ? {} : { academicSessionId: sessionId },
    orderBy: { createdAt: "desc" },
    include: {
      academicSession: { select: { title: true } },
      supervisor: { select: { name: true } },
      members: { include: { student: true } },
      marks: true,
    },
  });

  const rows: AwardListRow[] = [];
  for (const project of projects) {
    for (const member of project.members) {
      const marksByKey: Record<string, number | null> = {};
      for (const mark of project.marks.filter((m) => m.studentId === member.studentId)) {
        marksByKey[`${mark.semester}_${mark.componentType}`] = Number(mark.marksAwarded);
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
  const filename =
    sessionId === "all" ? "award-list-all.csv" : `award-list-${sessionId}.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
