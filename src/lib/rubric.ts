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

export const PROJECT_TYPES = ["SOFTWARE", "RESEARCH"] as const;

export const PROJECT_TYPE_LABELS: Record<(typeof PROJECT_TYPES)[number], string> = {
  SOFTWARE: "Application software",
  RESEARCH: "Research project",
};

export const SOFTWARE_PHASES = [
  "REQUIREMENTS",
  "DESIGN",
  "IMPLEMENTATION",
  "TESTING",
  "DEPLOYMENT_MAINTENANCE",
] as const;

export const SOFTWARE_PHASE_LABELS: Record<(typeof SOFTWARE_PHASES)[number], string> = {
  REQUIREMENTS: "Requirements",
  DESIGN: "Design",
  IMPLEMENTATION: "Implementation",
  TESTING: "Testing",
  DEPLOYMENT_MAINTENANCE: "Deployment / Maintenance",
};

export const RESEARCH_PHASES = [
  "PROBLEM_DEFINITION",
  "EDA",
  "DATA_ENGINEERING_PREPROCESSING",
  "EXPERIMENTAL_SETUP_MODEL_DESIGN",
  "TRAINING_OPTIMIZATION_TESTING",
  "VALIDATION_RESULTS_SYNTHESIS",
  "THESIS_WRITING",
] as const;

export const RESEARCH_PHASE_LABELS: Record<(typeof RESEARCH_PHASES)[number], string> = {
  PROBLEM_DEFINITION: "Problem Definition",
  EDA: "EDA",
  DATA_ENGINEERING_PREPROCESSING: "Data Engineering & Preprocessing",
  EXPERIMENTAL_SETUP_MODEL_DESIGN: "Experimental Setup & Model Design",
  TRAINING_OPTIMIZATION_TESTING: "Training, Optimization & Iterative Testing",
  VALIDATION_RESULTS_SYNTHESIS: "Validation & Results Synthesis",
  THESIS_WRITING: "Thesis Writing",
};

export const MAX_PROJECT_MEMBERS = 3;

/**
 * Ordered phase keys + display labels for a project's type — used both
 * by phase-checklist tracking (ProjectPhaseProgress) and by the SDLC_PHASE
 * mark component's per-phase mark rows, so the two stay in lockstep: the
 * phases you mark completion on are the same ones you assign a mark to.
 */
export function getPhasesForType(
  type: (typeof PROJECT_TYPES)[number],
): readonly string[] {
  return type === "SOFTWARE" ? SOFTWARE_PHASES : RESEARCH_PHASES;
}

export function getPhaseLabel(
  type: (typeof PROJECT_TYPES)[number],
  phaseKey: string,
): string {
  const labels: Record<string, string> =
    type === "SOFTWARE" ? SOFTWARE_PHASE_LABELS : RESEARCH_PHASE_LABELS;
  return labels[phaseKey] ?? phaseKey;
}

// Default number of weekly-meeting slots (Week 1, Week 2, …) a new weight
// scheme gets per semester, matching a typical 14-week semester. Editable
// per scheme on the weight scheme create form.
export const DEFAULT_WEEKLY_MEETING_WEEKS = 14;
