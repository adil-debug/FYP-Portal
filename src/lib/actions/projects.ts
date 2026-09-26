"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import {
  PROJECT_TYPES,
  SOFTWARE_PHASES,
  RESEARCH_PHASES,
  MAX_PROJECT_MEMBERS,
} from "@/lib/rubric";
import type { ActionResult } from "./sessions";

export async function createProject(
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser();

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const type = String(formData.get("type") ?? "");
  const academicSessionId = String(formData.get("academicSessionId") ?? "");
  const weightSchemeId = String(formData.get("weightSchemeId") ?? "");
  const studentIds = formData.getAll("studentIds").map(String).filter(Boolean);

  // Coordinators pick a supervisor explicitly; faculty are always their
  // own supervisor (a faculty account can't assign a project to someone
  // else, even by tampering with the form — we ignore any supervisorId
  // they send and always use their own session).
  const supervisorId =
    user.role === "COORDINATOR"
      ? String(formData.get("supervisorId") ?? "")
      : user.userId;

  if (!title) {
    return { error: "Project title is required." };
  }
  if (!PROJECT_TYPES.includes(type as (typeof PROJECT_TYPES)[number])) {
    return { error: "Please choose a valid project type." };
  }
  if (!academicSessionId) {
    return { error: "Please choose an academic session." };
  }
  if (!weightSchemeId) {
    return { error: "Please choose a weight scheme." };
  }
  if (!supervisorId) {
    return { error: "Please choose a supervisor." };
  }
  if (studentIds.length === 0) {
    return { error: "Select at least one student." };
  }
  if (studentIds.length > MAX_PROJECT_MEMBERS) {
    return { error: `A project can have at most ${MAX_PROJECT_MEMBERS} students.` };
  }
  if (new Set(studentIds).size !== studentIds.length) {
    return { error: "The same student was selected more than once." };
  }

  // Defense in depth: re-verify the chosen supervisor really is a faculty
  // account, since a coordinator's browser could in theory submit any id.
  const supervisor = await prisma.user.findUnique({
    where: { id: supervisorId },
  });
  if (!supervisor || supervisor.role !== "FACULTY") {
    return { error: "The selected supervisor is not a valid faculty account." };
  }

  const phases = type === "SOFTWARE" ? SOFTWARE_PHASES : RESEARCH_PHASES;
  const phaseRows = phases.map((phase) =>
    type === "SOFTWARE"
      ? { softwarePhase: phase as (typeof SOFTWARE_PHASES)[number] }
      : { researchPhase: phase as (typeof RESEARCH_PHASES)[number] },
  );

  let projectId: string;
  try {
    const project = await prisma.project.create({
      data: {
        title,
        description: description || null,
        type: type as (typeof PROJECT_TYPES)[number],
        academicSessionId,
        supervisorId,
        createdById: user.userId,
        weightSchemeId,
        members: {
          create: studentIds.map((studentId) => ({ studentId })),
        },
        phases: { create: phaseRows },
      },
    });
    projectId = project.id;
  } catch {
    return {
      error:
        "Could not create the project. Double-check the academic session and weight scheme still exist.",
    };
  }

  revalidatePath("/dashboard");
  revalidatePath("/coordinator/projects");
  redirect(`/projects/${projectId}`);
}
