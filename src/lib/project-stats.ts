// Shared, non-server helpers for computing marks-progress and at-risk
// status from raw Prisma rows. Kept outside any "use server" file (those
// may only export async functions) and outside React components so both
// server components and the CSV export logic can reuse the exact same
// rules without drifting apart.

import { COMPONENT_TYPES, SEMESTERS, PROJECT_TYPES, getPhasesForType } from "@/lib/rubric";

// Prisma's Decimal type (and its string/number serializations) all expose
// a working `.toString()`, which is all Number(...) needs below — so these
// helpers accept anything stringifiable rather than importing the actual
// Decimal type here and coupling this non-server file to Prisma's client.
type Decimalish = number | string | { toString(): string };

export type MinimalPhase = { status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" };

export type MinimalWeight = {
  semester: string;
  componentType: string;
  maxMarks: Decimalish;
};

export type MinimalMark = {
  studentId: string;
  semester: string;
  componentType: string;
  marksAwarded: Decimalish;
  maxMarks: Decimalish;
};

/**
 * How many (student, semester, component[, week/phase]) mark "slots" a
 * project has in total (only counting components the weight scheme
 * actually allocates marks to for that semester), and how many of those
 * slots have a Mark row entered so far.
 *
 * WEEKLY_MEETINGS and SDLC_PHASE each expand into multiple slots per
 * (semester, component) — one per week (weeklyMeetingWeeks) or per phase
 * of the project's type (5 SDLC phases, 7 research phases) — since a Mark
 * row now exists per week/phase rather than one lump mark for the whole
 * component.
 */
export function computeMarksProgress(params: {
  studentCount: number;
  weights: MinimalWeight[];
  marks: MinimalMark[];
  weeklyMeetingWeeks: number;
  projectType: (typeof PROJECT_TYPES)[number];
}): { entered: number; total: number } {
  const { studentCount, weights, marks, weeklyMeetingWeeks, projectType } = params;

  let configuredSlotsPerStudent = 0;
  for (const semester of SEMESTERS) {
    for (const component of COMPONENT_TYPES) {
      const weight = weights.find(
        (w) => w.semester === semester && w.componentType === component,
      );
      if (!weight || Number(weight.maxMarks) <= 0) continue;

      if (component === "WEEKLY_MEETINGS") {
        configuredSlotsPerStudent += weeklyMeetingWeeks;
      } else if (component === "SDLC_PHASE") {
        configuredSlotsPerStudent += getPhasesForType(projectType).length;
      } else {
        configuredSlotsPerStudent += 1;
      }
    }
  }

  const total = configuredSlotsPerStudent * studentCount;
  const entered = marks.length;
  return { entered, total };
}

/**
 * A project is flagged "at risk" when either:
 * - every phase is still NOT_STARTED (nothing has begun despite the
 *   project existing), or
 * - any mark entered so far is below 50% of its own max (an early signal
 *   of a struggling student/component), rather than a global average,
 *   since one weak component is enough to warrant a look.
 */
export function isProjectAtRisk(params: {
  phases: MinimalPhase[];
  marks: MinimalMark[];
}): boolean {
  const { phases, marks } = params;

  const noProgressStarted =
    phases.length > 0 && phases.every((p) => p.status === "NOT_STARTED");

  const hasLowMark = marks.some((m) => {
    const max = Number(m.maxMarks);
    if (max <= 0) return false;
    return Number(m.marksAwarded) / max < 0.5;
  });

  return noProgressStarted || hasLowMark;
}
