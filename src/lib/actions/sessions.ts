"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireCoordinator } from "@/lib/session";

export type ActionResult = { error?: string; success?: boolean };

export async function createAcademicSession(
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  await requireCoordinator();

  const title = String(formData.get("title") ?? "").trim();
  if (!title) {
    return { error: "Title is required (e.g. \"2025-2026\")." };
  }

  const existing = await prisma.academicSession.findUnique({
    where: { title },
  });
  if (existing) {
    return { error: `An academic session named "${title}" already exists.` };
  }

  await prisma.academicSession.create({ data: { title } });
  revalidatePath("/coordinator/sessions");
  return { success: true };
}

/**
 * Session rollover ("start new semester"): creates a new AcademicSession
 * and clones the current default WeightScheme's component weights into a
 * brand-new scheme, so the new semester starts with a sensible baseline
 * instead of an empty one. Deliberately does NOT copy any projects or
 * students — a new semester means new projects, created fresh against the
 * new session.
 */
export async function startNewSemester(
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireCoordinator();

  const title = String(formData.get("title") ?? "").trim();
  if (!title) {
    return { error: "Title is required (e.g. \"2026-2027\")." };
  }

  const existing = await prisma.academicSession.findUnique({ where: { title } });
  if (existing) {
    return { error: `An academic session named "${title}" already exists.` };
  }

  const defaultScheme = await prisma.weightScheme.findFirst({
    where: { isDefault: true },
    include: { componentWeights: true },
  });

  await prisma.$transaction(async (tx) => {
    await tx.academicSession.create({ data: { title } });

    if (defaultScheme) {
      await tx.weightScheme.create({
        data: {
          name: `${defaultScheme.name} (${title})`,
          isDefault: false,
          createdById: user.userId,
          componentWeights: {
            create: defaultScheme.componentWeights.map((w) => ({
              semester: w.semester,
              componentType: w.componentType,
              maxMarks: w.maxMarks,
            })),
          },
        },
      });
    }
  });

  revalidatePath("/coordinator/sessions");
  revalidatePath("/coordinator/weight-schemes");
  revalidatePath("/weight-schemes");

  return {
    success: true,
    error: defaultScheme
      ? undefined
      : "Session created, but there was no default weight scheme to clone — set one up on the Weight Schemes page.",
  };
}

export async function toggleAcademicSessionActive(
  sessionId: string,
  isActive: boolean,
): Promise<void> {
  await requireCoordinator();
  await prisma.academicSession.update({
    where: { id: sessionId },
    data: { isActive },
  });
  revalidatePath("/coordinator/sessions");
}
