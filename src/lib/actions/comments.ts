"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import type { ActionResult } from "./sessions";

/**
 * Defense in depth: only a coordinator or the project's own supervising
 * faculty member may read or post project comments — never another
 * faculty account, and never a student (who has no login). Throws so
 * callers can't accidentally fall through to a default-allow path.
 */
async function requireCommentAccess(projectId: string) {
  const user = await requireUser();
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { supervisorId: true },
  });
  if (!project) {
    throw new Error("Project not found.");
  }
  const canAccess =
    user.role === "COORDINATOR" || project.supervisorId === user.userId;
  if (!canAccess) {
    throw new Error("Not authorized to view this project's comments.");
  }
  return user;
}

export async function listProjectComments(projectId: string) {
  await requireCommentAccess(projectId);
  return prisma.projectComment.findMany({
    where: { projectId },
    orderBy: { createdAt: "asc" },
    include: { author: { select: { name: true, role: true } } },
  });
}

export async function createProjectComment(
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const projectId = String(formData.get("projectId") ?? "");
  const body = String(formData.get("body") ?? "").trim();

  if (!projectId) {
    return { error: "Missing project reference." };
  }
  if (!body) {
    return { error: "Comment can't be empty." };
  }
  if (body.length > 4000) {
    return { error: "Comment is too long (max 4000 characters)." };
  }

  const user = await requireCommentAccess(projectId);

  await prisma.projectComment.create({
    data: { projectId, authorId: user.userId, body },
  });

  revalidatePath(`/projects/${projectId}`);
  return { success: true };
}
