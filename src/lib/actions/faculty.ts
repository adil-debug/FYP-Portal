"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireCoordinator } from "@/lib/session";
import { hashPassword } from "@/lib/auth";
import type { ActionResult } from "./sessions";

export async function createFacultyAccount(
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  await requireCoordinator();

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!name || !email || !password) {
    return { error: "Name, email, and password are all required." };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: `A user with email ${email} already exists.` };
  }

  const passwordHash = await hashPassword(password);

  await prisma.user.create({
    data: { name, email, passwordHash, role: "FACULTY" },
  });

  revalidatePath("/coordinator/faculty");
  return { success: true };
}

/**
 * Updates a faculty account's name/email, and optionally resets its
 * password (leave the password field blank to keep the current one).
 */
export async function updateFacultyAccount(
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  await requireCoordinator();

  const facultyId = String(formData.get("facultyId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!facultyId) {
    return { error: "Missing faculty reference." };
  }
  if (!name || !email) {
    return { error: "Name and email are required." };
  }
  if (password && password.length < 8) {
    return { error: "Password must be at least 8 characters, or left blank to keep the current one." };
  }

  const existing = await prisma.user.findUnique({ where: { id: facultyId } });
  if (!existing || existing.role !== "FACULTY") {
    return { error: "Faculty account not found." };
  }

  const emailTaken = await prisma.user.findUnique({ where: { email } });
  if (emailTaken && emailTaken.id !== facultyId) {
    return { error: `A user with email ${email} already exists.` };
  }

  await prisma.user.update({
    where: { id: facultyId },
    data: {
      name,
      email,
      ...(password ? { passwordHash: await hashPassword(password) } : {}),
    },
  });

  revalidatePath("/coordinator/faculty");
  return { success: true };
}

/**
 * Deletes a faculty account. Refused if the faculty member still
 * supervises any projects, so a project is never left without a
 * supervisor — the coordinator must reassign or delete those projects
 * first (see updateProject / deleteProject in projects.ts).
 */
export async function deleteFacultyAccount(
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  await requireCoordinator();

  const facultyId = String(formData.get("facultyId") ?? "");
  if (!facultyId) {
    return { error: "Missing faculty reference." };
  }

  const existing = await prisma.user.findUnique({
    where: { id: facultyId },
    include: { _count: { select: { supervisedProjects: true } } },
  });
  if (!existing || existing.role !== "FACULTY") {
    return { error: "Faculty account not found." };
  }

  if (existing._count.supervisedProjects > 0) {
    return {
      error: `This faculty member still supervises ${existing._count.supervisedProjects} project(s). Reassign or delete those projects first.`,
    };
  }

  await prisma.user.delete({ where: { id: facultyId } });

  revalidatePath("/coordinator/faculty");
  redirect("/coordinator/faculty");
}
