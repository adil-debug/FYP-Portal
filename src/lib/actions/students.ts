"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import type { ActionResult } from "./sessions";

/**
 * Creates a student record. Both a coordinator and any faculty member may
 * call this — a faculty member often knows their own supervisees' details
 * before the coordinator has entered them, and a student isn't tied to
 * any one faculty account (it just becomes available to add to a project,
 * same as when a coordinator creates one).
 */
export async function createStudent(
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  await requireUser();

  const name = String(formData.get("name") ?? "").trim();
  const rollNumber = String(formData.get("rollNumber") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!name || !rollNumber || !email) {
    return { error: "Name, roll number, and email are all required." };
  }

  const existing = await prisma.student.findUnique({ where: { rollNumber } });
  if (existing) {
    return {
      error: `A student with roll number ${rollNumber} already exists.`,
    };
  }

  await prisma.student.create({ data: { name, rollNumber, email } });

  revalidatePath("/coordinator/students");
  revalidatePath("/students");
  return { success: true };
}
