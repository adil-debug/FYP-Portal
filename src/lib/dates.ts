// Small date helpers shared between the project form (populating an
// <input type="date">'s defaultValue), the proposal-deadline badges
// (dashboard, project lists), and every "created at" / "updated at" /
// "posted at" display timestamp across the app. Kept in a plain module
// (no "use server", no React) so both server components and client
// components can import it directly.

// Every user of this portal is in Pakistan, so all *display* timestamps
// are rendered in Pakistan Time regardless of what timezone the server
// process itself runs in (Vercel's Node runtime defaults to UTC, which is
// why timestamps looked "wrong" before this was added — they were
// correct in UTC, just not in the reader's local time). Storage is
// unaffected: Postgres/Prisma DateTime columns stay UTC under the hood,
// this only controls how a Date is turned into text for display.
const DISPLAY_TIME_ZONE = "Asia/Karachi";

/**
 * Formats a Date as "YYYY-MM-DD" in Pakistan Time, the exact string shape
 * an <input type="date"> needs for its defaultValue/value. Returns null
 * for a null input so callers can pass a nullable DB field straight
 * through. Uses Pakistan Time (not UTC) so a date picked near midnight
 * doesn't silently shift to the previous/next day for a Pakistan-based
 * user.
 */
export function toDateInputValue(date: Date | null): string | null {
  if (!date) return null;
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: DISPLAY_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const lookup = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  return `${lookup.year}-${lookup.month}-${lookup.day}`;
}

/** Formats a Date as e.g. "Sep 26, 2026" in Pakistan Time. */
export function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    dateStyle: "medium",
    timeZone: DISPLAY_TIME_ZONE,
  });
}

/** Formats a Date as e.g. "Sep 26, 2026, 4:38 PM" in Pakistan Time. */
export function formatDateTime(date: Date): string {
  return date.toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: DISPLAY_TIME_ZONE,
  });
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
