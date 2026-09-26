// Builds the award-list CSV content shared by both the coordinator's
// (filterable, all-projects) and faculty's (own-projects-only) award list
// pages. Kept outside "use server" files since it's plain synchronous
// logic, not a Server Function.

import { COMPONENT_TYPES, COMPONENT_LABELS, SEMESTERS, SEMESTER_LABELS } from "@/lib/rubric";

export type AwardListRow = {
  studentName: string;
  rollNumber: string;
  projectTitle: string;
  supervisorName: string;
  academicSession: string;
  // marksByKey["FYP_1_PROPOSAL_SUBMISSION"] = awarded marks, or null if not entered
  marksByKey: Record<string, number | null>;
};

function csvEscape(value: string | number): string {
  const str = String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function buildAwardListCsv(rows: AwardListRow[]): string {
  const header = [
    "Student Name",
    "Roll Number",
    "Project",
    "Supervisor",
    "Academic Session",
    ...SEMESTERS.flatMap((semester) =>
      COMPONENT_TYPES.map(
        (component) => `${SEMESTER_LABELS[semester]} - ${COMPONENT_LABELS[component]}`,
      ),
    ),
    ...SEMESTERS.map((semester) => `${SEMESTER_LABELS[semester]} Total`),
    "Grand Total",
  ];

  const lines = [header.map(csvEscape).join(",")];

  for (const row of rows) {
    const cells: (string | number)[] = [
      row.studentName,
      row.rollNumber,
      row.projectTitle,
      row.supervisorName,
      row.academicSession,
    ];

    const semesterTotals: number[] = [];
    for (const semester of SEMESTERS) {
      let semesterTotal = 0;
      for (const component of COMPONENT_TYPES) {
        const key = `${semester}_${component}`;
        const value = row.marksByKey[key];
        cells.push(value === null || value === undefined ? "" : value);
        semesterTotal += value ?? 0;
      }
      semesterTotals.push(semesterTotal);
    }

    cells.push(...semesterTotals);
    cells.push(semesterTotals.reduce((a, b) => a + b, 0));

    lines.push(cells.map(csvEscape).join(","));
  }

  return lines.join("\n");
}
