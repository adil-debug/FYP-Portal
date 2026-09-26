"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import type { ActionResult } from "./sessions";

const VALID_STATUSES = ["NOT_STARTED", "IN_PROGRESS", "COMPLETED"] as const;

/**
 * Updates a single ProjectPhaseProgress row's status/notes.
 *
 * Authorization: only the project's supervising faculty member or a
 * coordinator may update a phase — re-checked here even though the UI only
 * renders the edit form for those users, since a tampered request could
 * otherwise target any phase id directly.
 */
export async function updatePhaseProgress(
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser();

  const phaseId = String(formData.get("phaseId") ?? "");
  const status = String(formData.get("status") ?? "");
  const notes = String(formData.get("notes") ?? "").trim();
  const projectId = String(formData.get("projectId") ?? "");

  if (!phaseId || !projectId) {
    return { error: "Missing phase or project reference." };
  }

  if (!VALID_STATUSES.includes(status as (typeof VALID_STATUSES)[number])) {
    return { error: "Invalid status." };
  }

  const phase = await prisma.projectPhaseProgress.findUnique({
    where: { id: phaseId },
    include: { project: { select: { supervisorId: true, id: true } } },
  });

  if (!phase || phase.project.id !== projectId) {
    return { error: "Phase not found." };
  }

  const canEdit =
    user.role === "COORDINATOR" || phase.project.supervisorId === user.userId;
  if (!canEdit) {
    return { error: "You are not authorized to update this project." };
  }

  await prisma.projectPhaseProgress.update({
    where: { id: phaseId },
    data: {
      status: status as (typeof VALID_STATUSES)[number],
      notes: notes || null,
      completedAt: status === "COMPLETED" ? new Date() : null,
    },
  });

  revalidatePath(`/projects/${projectId}`);
  return { success: true };
}
