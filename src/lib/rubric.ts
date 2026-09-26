// Shared rubric constants (component types, semesters, and their display
// labels). Deliberately NOT in a "use server" file, since those files may
// only export async functions — plain constants/types must live elsewhere
// to be importable from both server actions and client components.

export const COMPONENT_TYPES = [
  "PROPOSAL_SUBMISSION",
  "WEEKLY_MEETINGS",
  "SDLC_PHASE",
  "PLAGIARISM",
  "THESIS_QUALITY",
] as const;

export const COMPONENT_LABELS: Record<(typeof COMPONENT_TYPES)[number], string> = {
  PROPOSAL_SUBMISSION: "Timely proposal submission",
  WEEKLY_MEETINGS: "Weekly meetings",
  SDLC_PHASE: "SDLC / research phase completion",
  PLAGIARISM: "Plagiarism",
  THESIS_QUALITY: "Thesis quality",
};

export const SEMESTERS = ["FYP_1", "FYP_2"] as const;

export const SEMESTER_LABELS: Record<(typeof SEMESTERS)[number], string> = {
  FYP_1: "FYP-I (Semester 7)",
  FYP_2: "FYP-II (Semester 8)",
};
