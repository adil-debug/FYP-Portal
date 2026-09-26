"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { COMPONENT_TYPES, SEMESTERS } from "@/lib/rubric";
import type { ActionResult } from "./sessions";

/**
 * Creates or updates a single student's mark for one (project, semester,
 * component) combination — the unit cell in the marks grid on a project's
 * detail page.
 *
 * The max for the mark is always read from the project's weight scheme
 * (never taken from the client), so the entered mark is validated against
 * the coordinator/faculty-configured ceiling rather than something a
 * tampered request could inflate. A max of 0 (component not configured
 * for this semester in this scheme) blocks entry entirely.
 */
export async function upsertMark(
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser();

  const projectId = String(formData.get("projectId") ?? "");
  const studentId = String(formData.get("studentId") ?? "");
  const semester = String(formData.get("semester") ?? "");
  const componentType = String(formData.get("componentType") ?? "");
  const marksAwardedRaw = String(formData.get("marksAwarded") ?? "").trim();
  const remarks = String(formData.get("remarks") ?? "").trim();

  if (!projectId || !studentId) {
    return { error: "Missing project or student reference." };
  }
  if (!SEMESTERS.includes(semester as (typeof SEMESTERS)[number])) {
    return { error: "Invalid semester." };
  }
  if (!COMPONENT_TYPES.includes(componentType as (typeof COMPONENT_TYPES)[number])) {
    return { error: "Invalid rubric component." };
  }
  if (marksAwardedRaw === "") {
    return { error: "Enter a mark." };
  }
  const marksAwarded = Number(marksAwardedRaw);
  if (!Number.isFinite(marksAwarded) || marksAwarded < 0) {
    return { error: "Marks must be a non-negative number." };
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      weightScheme: { include: { componentWeights: true } },
      members: { select: { studentId: true } },
    },
  });
  if (!project) {
    return { error: "Project not found." };
  }

  const canMark =
    user.role === "COORDINATOR" || project.supervisorId === user.userId;
  if (!canMark) {
    return { error: "You are not authorized to enter marks for this project." };
  }

  if (!project.members.some((m) => m.studentId === studentId)) {
    return { error: "That student is not a member of this project." };
  }

  const weight = project.weightScheme.componentWeights.find(
    (w) => w.semester === semester && w.componentType === componentType,
  );
  const maxMarks = weight ? Number(weight.maxMarks) : 0;
  if (maxMarks <= 0) {
    return {
      error:
        "This component isn't configured for this semester in the project's weight scheme.",
    };
  }
  if (marksAwarded > maxMarks) {
    return { error: `Marks can't exceed ${maxMarks} for this component.` };
  }

  await prisma.mark.upsert({
    where: {
      projectId_studentId_semester_componentType: {
        projectId,
        studentId,
        semester: semester as (typeof SEMESTERS)[number],
        componentType: componentType as (typeof COMPONENT_TYPES)[number],
      },
    },
    create: {
      projectId,
      studentId,
      semester: semester as (typeof SEMESTERS)[number],
      componentType: componentType as (typeof COMPONENT_TYPES)[number],
      marksAwarded,
      maxMarks,
      remarks: remarks || null,
      givenById: user.userId,
    },
    update: {
      marksAwarded,
      maxMarks,
      remarks: remarks || null,
      givenById: user.userId,
    },
  });

  revalidatePath(`/projects/${projectId}`);
  return { success: true };
}
