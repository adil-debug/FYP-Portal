import { getProposalDeadlineStatus } from "@/lib/dates";

/**
 * Small pill showing a project's proposal-deadline status. Renders nothing
 * for "none" (no due date set) and "upcoming" (due date more than the
 * due-soon window away) — the badge only needs to draw the eye when a
 * proposal is overdue or due soon, per the "dashboard badges + red flag in
 * project lists" design.
 */
export function ProposalDeadlineBadge({
  proposalDueAt,
  proposalSubmittedAt,
}: {
  proposalDueAt: Date | null;
  proposalSubmittedAt: Date | null;
}) {
  const status = getProposalDeadlineStatus({ proposalDueAt, proposalSubmittedAt });

  if (status.kind === "overdue") {
    return (
      <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700">
        Proposal overdue by {status.daysOverdue} day{status.daysOverdue === 1 ? "" : "s"}
      </span>
    );
  }
  if (status.kind === "due-soon") {
    return (
      <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
        {status.daysLeft === 0
          ? "Proposal due today"
          : `Proposal due in ${status.daysLeft} day${status.daysLeft === 1 ? "" : "s"}`}
      </span>
    );
  }
  return null;
}
