"use server";

import { revalidatePath } from "next/cache";
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
