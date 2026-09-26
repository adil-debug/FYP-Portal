// Small date helpers shared between the project form (populating an
// <input type="date">'s defaultValue) and the proposal-deadline badges
// (dashboard, project lists). Kept in a plain module (no "use server",
// no React) so both server components and client components can import
// it directly.

/**
 * Formats a Date as "YYYY-MM-DD" in UTC, the exact string shape an
 * <input type="date"> needs for its defaultValue/value. Returns null for
 * a null input so callers can pass a nullable DB field straight through.
 */
export function toDateInputValue(date: Date | null): string | null {
  if (!date) return null;
  return date.toISOString().slice(0, 10);
}

export type ProposalDeadlineStatus =
  | { kind: "none" }
  | { kind: "submitted" }
  | { kind: "overdue"; daysOverdue: number }
  | { kind: "due-soon"; daysLeft: number }
  | { kind: "upcoming" };

// A deadline counts as "due soon" inside this many days — close enough to
// need a heads-up, per the badges design (dashboard + project lists).
const DUE_SOON_WINDOW_DAYS = 7;

/**
 * Classifies a project's proposal deadline for badge display. An
 * already-submitted proposal is never flagged, regardless of the due
 * date, since the thing the badge warns about (a missed deadline)
 * already didn't happen.
 */
export function getProposalDeadlineStatus(params: {
  proposalDueAt: Date | null;
  proposalSubmittedAt: Date | null;
  now?: Date;
}): ProposalDeadlineStatus {
  const { proposalDueAt, proposalSubmittedAt, now = new Date() } = params;

  if (proposalSubmittedAt) {
    return { kind: "submitted" };
  }
  if (!proposalDueAt) {
    return { kind: "none" };
  }

  const msPerDay = 24 * 60 * 60 * 1000;
  const diffDays = Math.floor((proposalDueAt.getTime() - now.getTime()) / msPerDay);

  if (diffDays < 0) {
    return { kind: "overdue", daysOverdue: Math.abs(diffDays) };
  }
  if (diffDays <= DUE_SOON_WINDOW_DAYS) {
    return { kind: "due-soon", daysLeft: diffDays };
  }
  return { kind: "upcoming" };
}
