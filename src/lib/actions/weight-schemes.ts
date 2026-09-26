"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireCoordinator, requireUser } from "@/lib/session";
import {
  COMPONENT_TYPES,
  SEMESTERS,
  SEMESTER_LABELS,
  DEFAULT_WEEKLY_MEETING_WEEKS,
} from "@/lib/rubric";
import type { ActionResult } from "./sessions";

function parseWeight(formData: FormData, semester: string, component: string): number {
  const raw = formData.get(`weight_${semester}_${component}`);
  const value = Number(raw);
  return Number.isFinite(value) && value >= 0 ? value : 0;
}

/**
 * Creates a weight scheme. Both a coordinator and any faculty member can
 * call this — a faculty member may want a scheme with a different split
 * than the coordinator's default for a project they supervise. Whatever
 * scheme gets created is available to everyone as an option when
 * creating/editing a project (the picker on /projects/new and
 * /projects/[id]/edit lists every scheme, unfiltered by who created it),
 * but only a COORDINATOR may mark a scheme as the site-wide default —
 * that's re-checked here server-side, not just hidden in the faculty UI,
 * since a default affects every new project across every faculty member.
 */
export async function createWeightScheme(
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser();

  const name = String(formData.get("name") ?? "").trim();
  const isDefault = user.role === "COORDINATOR" && formData.get("isDefault") === "on";
  const weeklyMeetingWeeksRaw = Number(formData.get("weeklyMeetingWeeks"));
  const weeklyMeetingWeeks =
    Number.isFinite(weeklyMeetingWeeksRaw) && weeklyMeetingWeeksRaw > 0
      ? Math.floor(weeklyMeetingWeeksRaw)
      : DEFAULT_WEEKLY_MEETING_WEEKS;

  if (!name) {
    return { error: "Scheme name is required." };
  }

  const componentWeights: {
    semester: (typeof SEMESTERS)[number];
    componentType: (typeof COMPONENT_TYPES)[number];
    maxMarks: number;
  }[] = [];

  const totals: Record<string, number> = { FYP_1: 0, FYP_2: 0 };

  for (const semester of SEMESTERS) {
    for (const componentType of COMPONENT_TYPES) {
      const maxMarks = parseWeight(formData, semester, componentType);
      totals[semester] += maxMarks;
      componentWeights.push({ semester, componentType, maxMarks });
    }
  }

  const warnings: string[] = [];
  for (const semester of SEMESTERS) {
    if (totals[semester] !== 100) {
      warnings.push(
        `${SEMESTER_LABELS[semester]} weights total ${totals[semester]}, not 100.`,
      );
    }
  }

  await prisma.$transaction(async (tx) => {
    if (isDefault) {
      // Only one scheme may be marked as default at a time.
      await tx.weightScheme.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }

    await tx.weightScheme.create({
      data: {
        name,
        isDefault,
        weeklyMeetingWeeks,
        createdById: user.userId,
        componentWeights: { create: componentWeights },
      },
    });
  });

  revalidatePath("/coordinator/weight-schemes");
  revalidatePath("/weight-schemes");

  if (warnings.length > 0) {
    return {
      success: true,
      error: `Scheme created, but: ${warnings.join(" ")} You can edit it later.`,
    };
  }

  return { success: true };
}

export async function setDefaultWeightScheme(schemeId: string): Promise<void> {
  await requireCoordinator();

  await prisma.$transaction([
    prisma.weightScheme.updateMany({
      where: { isDefault: true },
      data: { isDefault: false },
    }),
    prisma.weightScheme.update({
      where: { id: schemeId },
      data: { isDefault: true },
    }),
  ]);

  revalidatePath("/coordinator/weight-schemes");
  revalidatePath("/weight-schemes");
}

/**
 * Deletes a weight scheme. Either role can call this (both a coordinator
 * and any faculty member may need to clean up a scheme they created or
 * one that's no longer needed), but — same defense-in-depth pattern used
 * for deleteProject / deleteFacultyAccount — the check re-runs here
 * server-side regardless of what the UI already disabled:
 * - a scheme still assigned to one or more projects can't be deleted
 *   (those projects would be left pointing at a non-existent scheme);
 *   reassign or delete those projects first.
 * - the current default scheme can't be deleted either, since every new
 *   project needs a default to fall back to; make a different scheme the
 *   default first.
 */
export async function deleteWeightScheme(
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  await requireUser();

  const schemeId = String(formData.get("schemeId") ?? "");
  if (!schemeId) {
    return { error: "Missing weight scheme reference." };
  }

  const existing = await prisma.weightScheme.findUnique({
    where: { id: schemeId },
    include: { _count: { select: { projects: true } } },
  });
  if (!existing) {
    return { error: "Weight scheme not found." };
  }

  if (existing.isDefault) {
    return {
      error:
        "This is the default scheme, so it can't be deleted. Make a different scheme the default first.",
    };
  }

  if (existing._count.projects > 0) {
    return {
      error: `This scheme is still used by ${existing._count.projects} project(s). Reassign those projects to a different scheme first.`,
    };
  }

  await prisma.weightScheme.delete({ where: { id: schemeId } });

  revalidatePath("/coordinator/weight-schemes");
  revalidatePath("/weight-schemes");

  return { success: true };
}
