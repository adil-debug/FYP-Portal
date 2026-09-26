"use server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { hashPassword, verifyPassword } from "@/lib/auth";
import type { ActionResult } from "./sessions";

/**
 * Lets any logged-in user (faculty or coordinator) change their own
 * password — the coordinator sets/generates a faculty member's initial
 * password (see createFacultyAccount / updateFacultyAccount in
 * faculty.ts), but the faculty member themselves has no way to change it
 * afterward without this. Requires the current password, so a session
 * left open on a shared computer can't be used to lock the real owner
 * out by silently changing their password.
 */
export async function changeOwnPassword(
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser();

  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!currentPassword || !newPassword || !confirmPassword) {
    return { error: "All three fields are required." };
  }
  if (newPassword.length < 8) {
    return { error: "New password must be at least 8 characters." };
  }
  if (newPassword !== confirmPassword) {
    return { error: "New password and confirmation don't match." };
  }

  const account = await prisma.user.findUnique({ where: { id: user.userId } });
  if (!account) {
    return { error: "Account not found." };
  }

  const currentOk = await verifyPassword(currentPassword, account.passwordHash);
  if (!currentOk) {
    return { error: "Current password is incorrect." };
  }

  if (currentPassword === newPassword) {
    return { error: "New password must be different from the current one." };
  }

  await prisma.user.update({
    where: { id: user.userId },
    data: { passwordHash: await hashPassword(newPassword) },
  });

  return { success: true };
}
