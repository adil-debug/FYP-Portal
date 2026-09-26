"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { COMPONENT_TYPES, SEMESTERS, getPhasesForType } from "@/lib/rubric";
import type { ActionResult } from "./sessions";

/**
 * Creates or updates a single student's mark for one (project, semester,
 * component[, week/phase]) combination — the unit cell in the marks grid
 * on a project's detail page.
 *
 * The max for the mark is always computed from the project's weight
 * scheme (never taken from the client): the component's configured max
 * for that semester, divided evenly across however many weeks
 * (WEEKLY_MEETINGS) or phases (SDLC_PHASE) apply, or used as-is for every
 * other component. So the entered mark is always validated against the
 * coordinator/faculty-configured ceiling rather than something a
 * tampered request could inflate.
 *
 * weekNumber and phaseKey are only meaningful for WEEKLY_MEETINGS and
 * SDLC_PHASE respectively; for every other component they're ignored and
 * stored as the "not applicable" defaults (0 / "").
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
  const weekNumberRaw = String(formData.get("weekNumber") ?? "").trim();
  const phaseKey = String(formData.get("phaseKey") ?? "").trim();
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
  const componentMax = weight ? Number(weight.maxMarks) : 0;
  if (componentMax <= 0) {
    return {
      error:
        "This component isn't configured for this semester in the project's weight scheme.",
    };
  }

  // Resolve which sub-unit (week or phase) this mark is for, and its
  // individual max — an equal share of the component's configured total.
  let weekNumber = 0;
  let resolvedPhaseKey = "";
  let maxMarks = componentMax;

  if (componentType === "WEEKLY_MEETINGS") {
    const weekCount = project.weightScheme.weeklyMeetingWeeks;
    weekNumber = Number(weekNumberRaw);
    if (!Number.isInteger(weekNumber) || weekNumber < 1 || weekNumber > weekCount) {
      return { error: `Week must be between 1 and ${weekCount}.` };
    }
    maxMarks = Math.round((componentMax / weekCount) * 100) / 100;
  } else if (componentType === "SDLC_PHASE") {
    const validPhases = getPhasesForType(project.type);
    if (!validPhases.includes(phaseKey)) {
      return { error: "Invalid project phase." };
    }
    resolvedPhaseKey = phaseKey;
    maxMarks = Math.round((componentMax / validPhases.length) * 100) / 100;
  }

  if (marksAwarded > maxMarks) {
    return { error: `Marks can't exceed ${maxMarks} for this ${componentType === "WEEKLY_MEETINGS" ? "week" : componentType === "SDLC_PHASE" ? "phase" : "component"}.` };
  }

  await prisma.mark.upsert({
    where: {
      projectId_studentId_semester_componentType_weekNumber_phaseKey: {
        projectId,
        studentId,
        semester: semester as (typeof SEMESTERS)[number],
        componentType: componentType as (typeof COMPONENT_TYPES)[number],
        weekNumber,
        phaseKey: resolvedPhaseKey,
      },
    },
    create: {
      projectId,
      studentId,
      semester: semester as (typeof SEMESTERS)[number],
      componentType: componentType as (typeof COMPONENT_TYPES)[number],
      weekNumber,
      phaseKey: resolvedPhaseKey,
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
