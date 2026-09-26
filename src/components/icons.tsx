// Small inline SVG icon set used in navigation (sidebar, dashboard
// headers). Kept as plain inline SVG rather than an icon library
// dependency — this is the full set the app needs, so a library would
// add weight for no real benefit.
import type { SVGProps } from "react";

function Icon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    />
  );
}

export function OverviewIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </Icon>
  );
}

export function ProjectsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
    </Icon>
  );
}

export function MarksIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M4 19V10" />
      <path d="M12 19V5" />
      <path d="M20 19v-7" />
    </Icon>
  );
}

export function AwardIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="8" r="5" />
      <path d="M8.5 12.5 7 21l5-2.5L17 21l-1.5-8.5" />
    </Icon>
  );
}

export function SessionsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18" />
      <path d="M8 3v4" />
      <path d="M16 3v4" />
    </Icon>
  );
}

export function FacultyIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <circle cx="9" cy="8" r="3.25" />
      <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
      <path d="M16 5.5a3.25 3.25 0 0 1 0 6.4" />
      <path d="M15 14.2a6.5 6.5 0 0 1 6.5 5.8" />
    </Icon>
  );
}

export function StudentsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M2 9.5 12 4l10 5.5-10 5.5Z" />
      <path d="M6 12v5c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5v-5" />
    </Icon>
  );
}

export function WeightSchemesIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M12 3v18" />
      <path d="M5 7h14" />
      <path d="m5 7-3 6a3 3 0 0 0 6 0Z" />
      <path d="m19 7 3 6a3 3 0 0 1-6 0Z" />
    </Icon>
  );
}
