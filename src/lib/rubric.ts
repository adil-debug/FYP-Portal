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
  "LITERATURE_REVIEW",
  "PROPOSAL",
  "METHODOLOGY",
  "DATA_COLLECTION",
  "ANALYSIS",
  "THESIS_WRITING",
] as const;

export const RESEARCH_PHASE_LABELS: Record<(typeof RESEARCH_PHASES)[number], string> = {
  LITERATURE_REVIEW: "Literature Review",
  PROPOSAL: "Proposal",
  METHODOLOGY: "Methodology",
  DATA_COLLECTION: "Data Collection",
  ANALYSIS: "Analysis",
  THESIS_WRITING: "Thesis Writing",
};

export const MAX_PROJECT_MEMBERS = 3;
