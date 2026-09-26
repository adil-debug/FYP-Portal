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

/**
 * Parses an optional <input type="date"> value ("YYYY-MM-DD") into a
 * Date, or null if left blank. Returns undefined (distinct from null) for
 * an invalid/unparseable value, so callers can tell "cleared" apart from
 * "malformed" without a separate error type.
 */
function parseOptionalDate(formData: FormData, field: string): Date | null | undefined {
  const raw = formData.get(field);
  if (raw === null || raw === "") return null;
  const value = new Date(String(raw));
  if (Number.isNaN(value.getTime())) return undefined;
  return value;
}

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
  const proposalDueAt = parseOptionalDate(formData, "proposalDueAt");
  const proposalSubmittedAt = parseOptionalDate(formData, "proposalSubmittedAt");

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
  if (proposalDueAt === undefined || proposalSubmittedAt === undefined) {
    return { error: "One of the proposal dates isn't a valid date." };
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
        proposalDueAt,
        proposalSubmittedAt,
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

/**
 * Updates an existing project's editable fields.
 *
 * Faculty may edit title, description, weight scheme, and the student
 * roster on any project they supervise. Coordinators may additionally
 * reassign the supervisor and the academic session, and may edit any
 * project regardless of who supervises it.
 */
export async function updateProject(
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser();

  const projectId = String(formData.get("projectId") ?? "");
  if (!projectId) {
    return { error: "Missing project reference." };
  }

  const existing = await prisma.project.findUnique({ where: { id: projectId } });
  if (!existing) {
    return { error: "Project not found." };
  }

  const canEdit =
    user.role === "COORDINATOR" || existing.supervisorId === user.userId;
  if (!canEdit) {
    return { error: "You are not authorized to edit this project." };
  }

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const weightSchemeId = String(formData.get("weightSchemeId") ?? "");
  const studentIds = formData.getAll("studentIds").map(String).filter(Boolean);
  const proposalDueAt = parseOptionalDate(formData, "proposalDueAt");
  const proposalSubmittedAt = parseOptionalDate(formData, "proposalSubmittedAt");

  if (!title) {
    return { error: "Project title is required." };
  }
  if (!weightSchemeId) {
    return { error: "Please choose a weight scheme." };
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
  if (proposalDueAt === undefined || proposalSubmittedAt === undefined) {
    return { error: "One of the proposal dates isn't a valid date." };
  }

  // Only a coordinator may move a project to a different supervisor or
  // academic session; a faculty account's request for either is ignored
  // and the existing values are kept, even if the form was tampered with.
  const academicSessionId =
    user.role === "COORDINATOR"
      ? String(formData.get("academicSessionId") ?? existing.academicSessionId)
      : existing.academicSessionId;
  const supervisorId =
    user.role === "COORDINATOR"
      ? String(formData.get("supervisorId") ?? existing.supervisorId)
      : existing.supervisorId;

  if (user.role === "COORDINATOR") {
    const supervisor = await prisma.user.findUnique({ where: { id: supervisorId } });
    if (!supervisor || supervisor.role !== "FACULTY") {
      return { error: "The selected supervisor is not a valid faculty account." };
    }
    const session = await prisma.academicSession.findUnique({
      where: { id: academicSessionId },
    });
    if (!session) {
      return { error: "The selected academic session no longer exists." };
    }
  }

  try {
    await prisma.$transaction([
      prisma.projectMember.deleteMany({ where: { projectId } }),
      prisma.project.update({
        where: { id: projectId },
        data: {
          title,
          description: description || null,
          weightSchemeId,
          academicSessionId,
          supervisorId,
          proposalDueAt,
          proposalSubmittedAt,
          members: { create: studentIds.map((studentId) => ({ studentId })) },
        },
      }),
    ]);
  } catch {
    return {
      error:
        "Could not update the project. Double-check the academic session and weight scheme still exist.",
    };
  }

  revalidatePath("/dashboard");
  revalidatePath("/coordinator/projects");
  revalidatePath(`/projects/${projectId}`);
  redirect(`/projects/${projectId}`);
}

/**
 * Deletes a project and everything that cascades from it (members, phase
 * progress, meetings, plagiarism checks, thesis reviews).
 *
 * Refuses to delete a project that already has any Mark rows, since those
 * represent recorded grades — the coordinator/faculty must remove marks
 * first, which is a deliberate speed bump against losing grading history
 * by accident.
 */
export async function deleteProject(
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser();

  const projectId = String(formData.get("projectId") ?? "");
  if (!projectId) {
    return { error: "Missing project reference." };
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { _count: { select: { marks: true } } },
  });
  if (!project) {
    return { error: "Project not found." };
  }

  const canDelete =
    user.role === "COORDINATOR" || project.supervisorId === user.userId;
  if (!canDelete) {
    return { error: "You are not authorized to delete this project." };
  }

  if (project._count.marks > 0) {
    return {
      error:
        "This project has recorded marks and can't be deleted. Remove its marks first.",
    };
  }

  await prisma.project.delete({ where: { id: projectId } });

  revalidatePath("/dashboard");
  revalidatePath("/coordinator/projects");
  redirect(user.role === "COORDINATOR" ? "/coordinator/projects" : "/dashboard");
}
