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

/**
 * Deletes a student record. Both a coordinator and any faculty member may
 * call this — same authorization as createStudent, since a student isn't
 * owned by whoever created or manages them.
 *
 * Refuses to delete a student who is still a member of any project: the
 * Student <-> ProjectMember/Mark relations aren't cascading deletes, so
 * this is both a data-integrity guard (a raw FK violation would otherwise
 * surface as a confusing database error) and the same deliberate speed
 * bump used for deleteProject — remove the student from their project(s)
 * first (via the project's edit page), which also takes their marks with
 * it, before the record itself can be removed.
 */
export async function deleteStudent(
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  await requireUser();

  const studentId = String(formData.get("studentId") ?? "");
  if (!studentId) {
    return { error: "Missing student reference." };
  }

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: { _count: { select: { memberships: true } } },
  });
  if (!student) {
    return { error: "Student not found." };
  }

  if (student._count.memberships > 0) {
    return {
      error:
        "This student is still assigned to a project and can't be deleted. Remove them from the project first.",
    };
  }

  await prisma.student.delete({ where: { id: studentId } });

  revalidatePath("/coordinator/students");
  revalidatePath("/students");
  return { success: true };
}
