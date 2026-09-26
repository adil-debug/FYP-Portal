"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireCoordinator } from "@/lib/session";
import { COMPONENT_TYPES, SEMESTERS, SEMESTER_LABELS } from "@/lib/rubric";
import type { ActionResult } from "./sessions";

function parseWeight(formData: FormData, semester: string, component: string): number {
  const raw = formData.get(`weight_${semester}_${component}`);
  const value = Number(raw);
  return Number.isFinite(value) && value >= 0 ? value : 0;
}

export async function createWeightScheme(
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const coordinator = await requireCoordinator();

  const name = String(formData.get("name") ?? "").trim();
  const isDefault = formData.get("isDefault") === "on";

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
        createdById: coordinator.userId,
        componentWeights: { create: componentWeights },
      },
    });
  });

  revalidatePath("/coordinator/weight-schemes");

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
}
