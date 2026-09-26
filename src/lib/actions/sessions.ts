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
