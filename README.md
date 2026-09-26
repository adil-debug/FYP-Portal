# Project Oversight Portal

An internal portal for the Final Year Project (FYP) Coordinator and Faculty
of a BS Computer Science program to track undergraduate project progress
across SDLC/research phases, and to record marks for:

1. Timely proposal submission
2. Weekly meetings
3. SDLC / research phase completion
4. Plagiarism
5. Thesis quality

Marks are entered per student (not per group), spread flexibly across
FYP-I (semester 7, 100 marks) and FYP-II (semester 8, 100 marks), for a
total of 200 marks per student. Whenever a component is marked, the
affected student(s) receive an email with a full breakdown of their
current marks across all components.

## Tech stack

- **Framework:** Next.js 16 (App Router, TypeScript, Turbopack)
- **Styling:** Tailwind CSS v4
- **Database:** PostgreSQL (hosted free on [Neon](https://neon.tech))
- **ORM:** Prisma 7 (`@prisma/client` + `@prisma/adapter-pg` driver adapter)
- **Auth:** Custom credentials login (bcrypt password hashing + signed JWT
  session cookies via `jose`) — not NextAuth/Auth.js, since its v5 is still
  in beta with no stable release
- **Email:** Resend
- **Hosting:** Vercel (free tier)

## Development phases

1. **Project scaffold** — Next.js + Tailwind + GitHub + Vercel
2. **Database setup** — Neon Postgres + Prisma schema
3. **Authentication** — Coordinator / Faculty login &amp; route protection
4. **Coordinator features** — create faculty &amp; student accounts, academic sessions, weight schemes
5. **Project creation & assignment** — faculty &amp; coordinator create projects, assign students
6. **SDLC / research phase tracking UI** — supervisor/coordinator update phase status & notes
7. **Marks entry** — per student, per component, per semester
8. **Student notifications on mark updates — skipped for now.** Two
   options were considered and both are deliberately deferred, not
   forgotten, until the user is ready to do the account setup each one
   requires:
   - **Email (Resend)** — requires verifying a domain you own before it
     can send to real recipients; a Vercel `.vercel.app` URL doesn't
     qualify, since Vercel owns that domain, not you. Buying a domain
     isn't a cost the user wants to take on right now.
   - **WhatsApp (Meta's WhatsApp Cloud API)** — free at this class size
     (1,000 free conversations/month), but requires a Meta Business
     Account, a dedicated WhatsApp Business phone number, and a
     pre-approved message template before it can message a student who
     hasn't messaged the portal's number first. No-setup alternatives
     (Twilio's WhatsApp sandbox, unofficial "automate your own WhatsApp
     Web" libraries) were ruled out — the sandbox requires each student to
     manually "join" first, and the unofficial libraries risk the sending
     number being banned since they go against WhatsApp's own terms.
   Either can be picked up later once the account setup is done, without
   changing anything else already built.
9. **Dashboards** — marks progress, at-risk flags, coordinator marks
   overview, simple charts, downloadable award lists
10. **UI polish & deployment finalization** (this step) — consistent
    hover/focus states, custom error pages, security headers, and a
    deployment checklist

## Getting started locally

```bash
npm install          # also runs `prisma generate` via postinstall
cp .env.example .env # then fill in your real Neon DATABASE_URL and SESSION_SECRET
npm run db:migrate   # creates tables from prisma/schema.prisma
npm run create-coordinator -- "Your Name" you@example.com "a-strong-password"
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll be redirected to
`/login`. Sign in with the coordinator account you just created.

## Data model

The schema (`prisma/schema.prisma`) covers:

- **User** — Faculty & Coordinator logins (`role: FACULTY | COORDINATOR`). Students never log in.
- **AcademicSession** — e.g. "2025-2026", groups projects by cohort.
- **Student** — no login; only receives email notifications.
- **WeightScheme** / **ComponentWeight** — configurable marks distribution per
  semester (FYP_1 / FYP_2) for each of the 5 rubric components. The
  coordinator marks one scheme as default; faculty can create their own.
- **Project** — software or research, linked to a supervisor (faculty),
  a weight scheme, and an academic session.
- **ProjectMember** — join table, up to 3 students per project.
- **ProjectPhaseProgress** — tracks each SDLC phase (software projects) or
  research phase (research projects) independently per project.
- **WeeklyMeeting** — meeting log backing the "weekly meetings" component.
- **PlagiarismCheck** — stores a similarity % (entered manually from an
  external tool such as Turnitin).
- **ThesisReview** — qualitative notes backing the "thesis quality" mark.
- **ProjectComment** — coordinator ↔ supervisor discussion thread for a
  project; visibility is enforced in application code (see "Project
  comments" below), not by the schema itself.
- **Mark** — the core rubric table: one row per (project, student, semester,
  component), so group members can receive different marks for the same
  component. A unique constraint prevents duplicate marks for the same
  combination.
- **MarkEmailNotification** — audit trail of every email sent when a mark
  is entered/updated.

## Authentication

There is no public sign-up page — by design, since accounts are only for
Faculty and the Coordinator (students never log in, they only receive
email notifications). How it works:

- **Passwords** are hashed with `bcryptjs` before being stored (`User.passwordHash`).
- **Sessions** are a signed JWT (via `jose`) stored in an `httpOnly`,
  `sameSite=lax` cookie named `portal_session`, valid for 1 hour from
  login (`SESSION_DURATION_SECONDS` in `src/lib/auth.ts`) — a fixed
  expiry, not a sliding/inactivity-based one, so an account is signed out
  exactly 1 hour after logging in even if it was active the whole time,
  and needs to log in again.
- **`proxy.ts`** (Next.js 16's replacement for `middleware.ts`) checks every
  request except `/login` and `/api/*` routes, redirecting to `/login` if
  there's no valid session, and further restricting any `/coordinator/*`
  route to Coordinator accounts only.
- Each Route Handler / Server Component **also** checks its own session via
  `src/lib/session.ts` (`getCurrentUser`, `requireUser`, `requireCoordinator`)
  rather than trusting `proxy.ts` alone — this is Next.js's own recommended
  defense-in-depth pattern, since a future change to the proxy matcher could
  otherwise silently leave a route unprotected.
- The **first Coordinator account** is created with the bootstrap script:
  ```bash
  npm run create-coordinator -- "Full Name" email@example.com "password"
  ```
  Once logged in as Coordinator, Phase 4 adds the UI to create Faculty
  accounts (and additional Coordinators) from within the app itself.

### Why not NextAuth (Auth.js)?

NextAuth v5 has been in beta for a long time with no stable release. For a
project you'll maintain long-term, depending on a library that could still
introduce breaking changes before its 1.0 isn't a good trade — especially
when the actual requirement (email+password login, two roles) doesn't need
NextAuth's OAuth-provider machinery at all. The custom approach here is
~150 lines of code total and fully under your control.

## Coordinator features

Everything under `/coordinator` is restricted to Coordinator accounts (both
by `proxy.ts` and by `src/app/coordinator/layout.tsx` re-checking the
session, plus every Server Function calling `requireCoordinator()`).

- **Academic Sessions** (`/coordinator/sessions`) — create cohorts like
  "2025-2026" and toggle them active/inactive. Every project belongs to
  one session.
- **Faculty** (`/coordinator/faculty`) — full CRUD on faculty accounts:
  - **Create**: the coordinator sets (or auto-generates) an initial
    password and shares it with the faculty member directly — there's no
    email step yet (that's Phase 8), so the password is shown once on
    screen after creation.
  - **Edit** (`/coordinator/faculty/[id]`, via the "Edit" link in the
    table): update a faculty member's name and email, and optionally
    reset their password (leave it blank to keep the current one).
  - **Delete**: removes the account, but only if the faculty member
    doesn't currently supervise any projects — the delete button is
    disabled with an explanation otherwise, and `deleteFacultyAccount`
    re-checks this server-side too, so a project is never left without a
    supervisor. Reassign or delete their projects first (via a project's
    own edit/delete, described below) if you need to remove the account.
- **Students** (`/coordinator/students`) — add student records (name, roll
  number, email). Students never get a login; roll number must be unique.
- **Weight Schemes** (`/coordinator/weight-schemes`, and read/delete-only
  for faculty at `/weight-schemes`) — configure how each semester's 100
  marks are split across the 5 rubric components. Multiple schemes can
  exist; exactly one is marked "Default" at a time (creating or promoting
  a new default automatically un-defaults the previous one). A scheme can
  be saved even if a semester's weights don't sum to 100 — the UI warns
  about it, since a coordinator may want to build it up in stages before
  finishing.
  - **Create** is coordinator-only, from `/coordinator/weight-schemes`.
  - **Delete** is available to both coordinator and faculty (any logged-in
    user), from either page. Two guards apply, both enforced server-side in
    `deleteWeightScheme` (not just as a disabled button): the current
    **default** scheme can't be deleted (every new project needs a default
    to fall back to — make a different scheme the default first), and a
    scheme still assigned to **any project** can't be deleted either
    (reassign or delete those projects first). There's no scheme "edit"
    yet — delete and recreate if the weights need to change.

All of the create forms use React's `useActionState` with Server Functions
(`"use server"`), so they work with progressive enhancement and don't need
any client-side data-fetching library.

### A note on `"use server"` files

A file marked `"use server"` (everything under `src/lib/actions/`) may
**only** export `async` functions — not constants, types being the one
exception since they're erased at compile time. That's why the shared
rubric constants (`COMPONENT_TYPES`, `SEMESTER_LABELS`, etc.) live in
`src/lib/rubric.ts` instead of alongside the weight-scheme Server
Functions — keep that split in mind if you add new shared constants later.

## Project creation & assignment

Two entry points, both using the same form and Server Function
(`src/lib/actions/projects.ts` → `createProject`):

- **Faculty** (`/projects/new`, reached from their `/dashboard` project list)
  create their own projects. They are automatically the supervisor — there
  is no field for it, and the Server Function ignores any `supervisorId`
  a tampered request might send, always using the logged-in faculty's own
  session instead.
- **Coordinator** (`/projects/new`, reached from `/coordinator/projects`)
  create a project and explicitly choose which faculty member supervises
  it, via a supervisor dropdown that only appears for coordinators.

Both paths go live immediately — there's no approval step, matching the
requirement that faculty-created projects don't need coordinator sign-off.

When a project is created:
- Up to 3 students are attached via `ProjectMember` (the form disables
  further checkboxes once 3 are selected; the Server Function re-validates
  this server-side too).
- The default weight scheme is pre-selected, but any existing scheme can
  be chosen instead.
- A full set of `ProjectPhaseProgress` rows is created automatically — 5
  SDLC phases for a `SOFTWARE` project, 6 research phases for a `RESEARCH`
  project — all starting as `NOT_STARTED`. Phase 6 builds the UI to update
  these; for now the project detail page (`/projects/[id]`) only displays
  them read-only.

Access to a project's detail page is restricted to its supervising faculty
member or any coordinator — enforced in the page itself (not just by
hiding links), verified end-to-end with a second faculty account that
gets redirected away when it tries the first faculty's project URL
directly.

## SDLC / research phase tracking

On a project's detail page (`/projects/[id]`), each phase row is expandable
for the supervising faculty member or a coordinator (`src/app/projects/[id]/phase-row.tsx`,
a client component using `useActionState` with the `updatePhaseProgress`
Server Function in `src/lib/actions/phases.ts`):

- Click a phase to expand it, choose a new **status** (Not started / In
  progress / Completed), optionally add **notes**, and save.
- Setting status to Completed stamps `completedAt`; moving it away from
  Completed clears that timestamp again.
- Any other logged-in user (a non-supervising faculty member) sees the same
  rows read-only, with no edit control rendered.

**Authorization is re-checked in the Server Function itself**, not just by
which UI is shown: `updatePhaseProgress` loads the phase's parent project
and confirms the caller is either a coordinator or that project's
supervisor before writing anything, exactly the same defense-in-depth
pattern used everywhere else in this app. This was verified end-to-end with
a second faculty account attempting to view/edit a project it doesn't
supervise — it's redirected away at the page level, so it never even sees
the form.

Both the faculty dashboard (`/dashboard`) and the coordinator's project
table (`/coordinator/projects`) now show a **phases completed** count (and
a small progress bar on the dashboard) computed from each project's
`ProjectPhaseProgress` rows, so progress is visible without opening every
project.

## Editing & deleting projects

Full CRUD is now in place for projects (`src/lib/actions/projects.ts`):

- **Edit** (`/projects/[id]/edit`, reached via an "Edit project" button on the
  detail page): faculty can change a project's title, description, weight
  scheme, and student roster on any project they supervise. The project
  **type** can't be changed after creation (its phase checklist depends on
  it). The **supervisor** and **academic session** fields are shown
  read-only to faculty and are only editable by a coordinator — enforced in
  `updateProject` itself, not just by hiding the fields, so a tampered
  request from a faculty account can't reassign either one.
- **Delete** ("Delete project" button on the detail page, with an inline
  confirm step before it submits): available to the supervising faculty
  member or any coordinator. **Deletion is refused if the project has any
  recorded `Mark` rows** — the button shows the reason and the project page
  displays a note explaining marks must be removed first. This is a
  deliberate safeguard against silently losing grading history; everything
  else (`ProjectMember`, `ProjectPhaseProgress`, `WeeklyMeeting`,
  `PlagiarismCheck`, `ThesisReview`) cascades on delete since none of that
  represents a final grade.

Both actions re-check authorization server-side the same way `createProject`
and `updatePhaseProgress` do, verified end-to-end with a non-supervising
faculty account that's redirected away before it can reach the edit page,
and with a seeded project that has a mark attached to confirm delete is
actually blocked (not just discouraged in the UI).

## Marks entry

On a project's detail page, a **Marks** grid sits below the phase tracker
(`src/app/projects/[id]/marks-grid.tsx`, backed by the `upsertMark` Server
Function in `src/lib/actions/marks.ts`):

- One row per student, one column per rubric component, with a **FYP-I /
  FYP-II** tab to switch semesters — each semester's marks are entered and
  stored completely independently.
- Each column header shows the max marks configured for that component in
  **this semester**, read from the project's weight scheme
  (`ComponentWeight`). Faculty/coordinator only ever enter the *awarded*
  mark; the max is never editable from this grid — it's owned by the weight
  scheme (`/coordinator/weight-schemes`).
- Clicking a cell opens a small inline form (marks awarded + optional
  remarks) and saves via the Server Function; the cell shows "not set" if
  the project's weight scheme doesn't allocate any marks to that component
  for the selected semester (entry is blocked in that case, both in the UI
  and server-side).
- **Authorization** matches the phase tracker: the supervising faculty
  member or any coordinator can enter marks; anyone else can't even reach
  the project's page. **The maximum is always re-read from the weight
  scheme server-side** and a submitted mark is rejected if it exceeds that
  ceiling — verified end-to-end by bypassing the browser's own HTML5 `max=`
  validation and confirming the server still rejects an over-max value and
  leaves the database unchanged.
- A per-student **Total** column sums that student's marks across all 5
  components for the selected semester.
- Marks aren't emailed to students yet — that's Phase 8. For now, a `Mark`
  row existing at all is also what blocks a project or a faculty account
  from being deleted (see the CRUD sections above), so removing test marks
  requires clearing them first (there's no bulk-delete UI for marks yet;
  this can be added if needed before Phase 8).

## Phase 9: Dashboards

Faculty and coordinator dashboards now surface project health at a glance,
without adding any new database tables — everything is computed on the fly
from existing phases/marks data in `src/lib/project-stats.ts`.

- **Marks progress per project** (`computeMarksProgress`). For each
  project, counts how many (student, semester, component) mark "slots" are
  actually configured by the weight scheme (a slot only counts if that
  component has a max mark greater than 0 for that semester) and how many
  of those slots have a `Mark` row entered so far. Shown as an `entered /
  total` count with a progress bar on the faculty dashboard, and rolled up
  into an "all projects" total on the coordinator overview.
- **At-risk / needs-attention flag** (`isProjectAtRisk`). A project is
  flagged when **either** of these is true (an OR, not an AND — either
  condition alone is enough to warrant a look):
  - every phase is still `NOT_STARTED` (nothing has begun despite the
    project existing), or
  - any mark entered so far is below 50% of its own max — checked
    component-by-component, not as a project-wide average, since one weak
    component is enough to flag it even if others are strong.
  Flagged projects show a red "Needs attention" badge on the faculty
  dashboard and in the coordinator marks overview table.
- **Coordinator-wide marks overview** (`/coordinator/marks-overview`) — one
  table with every project across every faculty member: title, type,
  supervisor, academic session, marks-entered count, running mark total,
  and the at-risk badge. Read-only; entering marks still happens on the
  project's own page.
- **Simple charts, no new dependency.** The coordinator overview
  (`/coordinator`) got two new stat cards ("Marks entered across all
  projects", "Projects needing attention") and a small horizontal bar
  chart breaking down every project's phase status into three bands (Not
  started / In progress / All phases done) — hand-built with plain
  `<div>` widths, no charting library.
- **Downloadable award list (CSV).** One row per student, with a column
  for every rubric component in both FYP-I and FYP-II, plus a semester
  subtotal and a grand total column. No new npm dependency — the CSV is
  built by hand in `src/lib/award-list-csv.ts` with proper escaping for
  commas/quotes/newlines. Two download endpoints, both re-checking the
  caller's role/ownership server-side rather than trusting anything the
  client sends:
  - **Coordinator** (`/coordinator/award-list` → `GET
    /api/award-list/coordinator?sessionId=...`) — every project, or
    filtered down to a single academic session via a dropdown (`sessionId`
    defaults to `all`).
  - **Faculty** (`/award-list` → `GET /api/award-list/faculty`) — always
    scoped to just the caller's own supervised students; there's no filter
    to pick, since the whole file only ever contains their own projects.

## Phase 10: UI polish & deployment finalization

### Consistent hover/focus states and contrast

Before this pass, hover/focus styling on inputs, selects, textareas, and
secondary/outline buttons was applied ad hoc — some forms got a clear
hover border, others (notably the phase-status dropdown/notes field on a
project's detail page, and a few mark-entry inputs) got only a static
border with no feedback at all, making it unclear they were interactive.
Disabled solid-color buttons also used a flat `opacity-60`, which washed
out the white button text against the page background.

Five shared CSS classes now live in `src/app/globals.css` and are applied
everywhere a matching element appears, instead of one-off Tailwind
utility strings per form:

- `.field-input` — text/number inputs, selects, textareas. Slate border →
  indigo border on hover → indigo border + ring on focus.
- `.btn-outline` / `.btn-outline-danger` — secondary buttons (Cancel, Back,
  Edit) and red "trigger a delete" buttons. Hover now shows a visibly
  darker border, a background tint, and a subtle shadow.
- `.btn-solid-primary` / `.btn-solid-danger` — solid indigo/red action
  buttons. Disabled state is a flatter, lighter background color instead
  of `opacity-60`, so the button text stays legible instead of washing
  out.
- `.hover-row` — list rows meant to be clicked (e.g. each phase in a
  project's SDLC/research phase list) get a visible background change on
  hover instead of no feedback.

### Custom error pages

- `src/app/not-found.tsx` — branded 404 page (matching the app's look)
  instead of the plain Next.js default, shown whenever `notFound()` is
  called or an unknown URL is visited.
- `src/app/error.tsx` — a client-side error boundary for exceptions
  thrown while rendering a page, with a "Try again" button and a link
  back to the dashboard. Note: this Next.js version's `error.tsx`
  receives a `retry` callback, not the `reset` prop from older Next.js
  versions/training data (see `AGENTS.md`).
- `src/app/global-error.tsx` — the rarer case of the root layout itself
  crashing. Uses inline styles rather than Tailwind classes, since it
  replaces the root layout (and therefore `globals.css` may not have
  loaded) when it's shown.

### Security headers & no indexing

This is an internal tool holding student names and marks, so:

- `next.config.ts` sets `X-Frame-Options: DENY`, `X-Content-Type-Options:
  nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, a
  `Permissions-Policy` disabling camera/microphone/geolocation, an
  `X-Robots-Tag: noindex, nofollow`, and a `Content-Security-Policy`
  scoped to `'self'` (no third-party scripts/styles/embeds anywhere in
  this app). The CSP only adds `'unsafe-eval'` when `NODE_ENV` isn't
  `production` — React/Turbopack's dev-mode tooling needs it for
  hot-reload and better stack traces, but a real Vercel deployment never
  does, so the deployed app keeps the stricter policy.
- `src/app/robots.ts` generates a `robots.txt` that disallows everything,
  and `src/app/layout.tsx`'s metadata sets `robots: { index: false,
  follow: false }` as a second layer, since not every crawler honors
  `robots.txt` and `X-Robots-Tag` the same way.

### Deployment checklist

See **`DEPLOYMENT.md`** for the ongoing operational checklist: what to
check before/after each push, how Neon's backups work, how to roll back a
bad deploy on Vercel, notes on adding a custom domain later, and what to
do if a real secret is ever accidentally committed.

### Small fix: project edit page navigation

The project edit page (`/projects/[id]/edit`) previously had no way to
leave without submitting the form — the only exit was "Save changes",
which redirects to the project detail page. It now has the same "&larr;
Back" link used elsewhere in the app, linking straight back to the
project's detail page, with no change to the existing save-and-redirect
behavior.

## Post-Phase-10 fixes and additions

### Project create page: back link and Cancel button

`/projects/new` had the same gap as the edit page above — no way to leave
without submitting. It now has a "&larr; Back" link (to
`/coordinator/projects` for a coordinator, `/dashboard` for faculty) plus
a "Cancel" button next to "Create project" that goes to the same place,
via a new `cancelHref` prop on the shared `ProjectForm` component
(`src/app/projects/new/project-form.tsx`) that both the create and edit
pages set to their own appropriate destination.

### Faculty can create their own weight schemes

Previously only a coordinator could create a weight scheme at all (full
CRUD was added earlier, but create was still coordinator-only). Now any
faculty member can create their own scheme from `/weight-schemes`, using
the same form the coordinator uses (`CreateSchemeForm`, now shared
between `/coordinator/weight-schemes` and `/weight-schemes` via an
`isCoordinator` prop). A faculty-created scheme:

- Shows up in the weight-scheme picker on `/projects/new` and
  `/projects/[id]/edit` for **everyone** — the picker already listed every
  scheme unfiltered, so no change was needed there — meaning a faculty
  member can assign their own scheme to any project they supervise (or a
  coordinator can assign it to any project too, since scheme choice isn't
  restricted by who created it).
- **Cannot** be marked the site-wide default. The "Set as default scheme"
  checkbox is hidden entirely for faculty in the UI, and
  `createWeightScheme` (`src/lib/actions/weight-schemes.ts`) also ignores
  `isDefault` server-side for any non-coordinator caller — so this isn't
  just a hidden checkbox, a tampered request can't set it either. Only a
  coordinator can change the default via `setDefaultWeightScheme`, which
  was already coordinator-only.
- Deletion still follows the existing full-CRUD rules (a default scheme,
  or one still assigned to any project, can't be deleted — see the
  "Weight Schemes" section above).

### Change your own password

Previously, once a coordinator set or reset a faculty member's password,
that faculty member had no way to change it themselves — only the
coordinator could reset it again via `/coordinator/faculty`. Both roles
can now change their own password from **"Change password"** in the
header (next to "Sign out"), which goes to `/account/change-password`
(`src/lib/actions/account.ts` → `changeOwnPassword`). This requires the
**current** password to be entered correctly first — so a session left
open on a shared computer can't be used to lock the real account owner
out by silently changing their password — plus a new password of at
least 8 characters, entered twice to catch typos. This is separate from,
and doesn't change, the coordinator's existing ability to reset a
faculty member's password directly from `/coordinator/faculty` (e.g. if
a faculty member forgets their password and can't log in to change it
themselves).

## Mobile layout & editable-field affordance

Two UI adjustments made alongside the CRUD work above:

- **Responsive layout.** The coordinator section's sidebar now stacks above
  the page content on narrow screens instead of squeezing into a fixed-width
  column (`src/app/coordinator/layout.tsx`), and becomes a horizontally
  scrollable tab row rather than wrapping awkwardly. Every table in the
  coordinator section (Projects, Faculty, Students, Sessions, Weight
  Schemes) now scrolls horizontally on narrow screens (`overflow-x-auto` +
  a `min-w` on the table) instead of being clipped. Header rows that pair a
  title with a right-aligned control (name + logout, back link + edit/delete
  buttons) now wrap and truncate instead of overflowing when the content is
  long. Verified with a real headless-browser check at a 375px-wide (iPhone
  SE) viewport across every page — zero horizontal overflow.
- **Editable vs. locked fields on the project edit page.** Every real input,
  textarea, and select now has a visible hover/focus border color change, so
  it's obvious it can be edited. Fields that are shown but can't be changed
  in the current context (project type after creation; academic session and
  supervisor for a faculty account, which only a coordinator can reassign)
  are now rendered with a distinct flat grey background and a small lock
  icon, not just explanatory text underneath — so the difference between
  "editable" and "locked" is visible at a glance (`src/app/projects/new/project-form.tsx`).

## Post-completion feature additions

With all 10 phases complete, the following features were added on top of
the finished app. This batch includes a schema change (the new
`ProjectComment` model) — run `npm run db:migrate` against your Neon
database after pulling this update, same as any other schema change.

### Proposal deadline tracking

The `Project` model already had `proposalDueAt` / `proposalSubmittedAt`
fields, but nothing in the UI ever set or surfaced them. Both dates are
now editable on the project create/edit form (optional `<input
type="date">` fields — `src/app/projects/new/project-form.tsx`,
`src/lib/actions/projects.ts`), and are classified into a status
(`getProposalDeadlineStatus` in `src/lib/dates.ts`) that drives small
badges: "Proposal overdue by N days" (red) or "Proposal due in N days"
(amber), shown next to the project title on the faculty dashboard, the
coordinator's all-projects list, and the individual project detail page.
An already-submitted proposal never shows a badge, regardless of its due
date. The coordinator overview page also gets a red "Proposal deadlines"
summary card (only rendered when at least one project is overdue or due
soon) linking through to the full projects list.

### Printable student/project report

Each project detail page now has a **"Print report"** link
(`/projects/[id]/report`) that renders a clean, print-friendly HTML page:
project info, supervisor, students, phase checklist, and a full marks
breakdown per student per semester with running totals. It has no
special PDF library — the page's own "Print / Save as PDF" button just
calls the browser's native `window.print()`, and print-specific CSS
(`print:` Tailwind variants) hides the on-screen chrome (back link,
print button) and removes card borders/shadows so it prints cleanly.
Anyone who can view a project (its supervisor or a coordinator) can view
its report — same authorization check as the project detail page.

### Project comments (coordinator ↔ supervisor)

Every project detail page now has a **Comments** thread
(`src/app/projects/[id]/comment-thread.tsx`, backed by the new
`ProjectComment` Prisma model and `src/lib/actions/comments.ts`) for
discussion between the coordinator and that project's supervising
faculty member. Visibility is enforced server-side, not just hidden in
the UI: `requireCommentAccess()` re-checks on every read and write that
the caller is either a coordinator or the project's own supervisor —
another faculty member (or anyone else) gets an error, not an empty
list. Students never see this (they have no login regardless). Since the
project detail page itself already redirects away anyone who isn't
authorized to view the project, an unauthorized user never even reaches
the comment thread's markup.

A comment can be deleted by whoever wrote it, or by a coordinator
(moderation) — `deleteProjectComment` re-checks this server-side, so a
faculty member (even the project's own supervisor) can't delete another
person's comment, only their own. The "Delete" link next to a comment
only renders for someone allowed to use it, but that's a convenience —
the real check is in the action.

### Academic session rollover ("Start new semester")

The Academic Sessions page (`/coordinator/sessions`) has a collapsed
**"Start new semester…"** action that, on confirmation, creates a new
`AcademicSession` and clones the current default weight scheme's
component weights into a new scheme named after it (e.g. "Standard
Scheme (2026-2027)") — so the new semester starts with a sensible
baseline instead of an empty one (`startNewSemester` in
`src/lib/actions/sessions.ts`). It deliberately does **not** copy any
projects or students — a new semester means new projects, created fresh
against the new session, same as any other academic session.

### Search / filter on list pages

Every list page across the app now has a client-side search box above
its table/grid, filtering by the fields visible in that list — no page
reload, no server round-trip:

- Coordinator: Projects, Students, Faculty, Marks Overview
- Faculty dashboard's own project list (`/dashboard`)
- Weight Schemes (both `/coordinator/weight-schemes` and
  `/weight-schemes`), searching by scheme name or creator

Each list's table/grid was pulled into its own small client component
(e.g. `projects-table.tsx`, `students-table.tsx`,
`marks-overview-table.tsx`) that takes the server-fetched rows as props
and filters them in memory against the search box's value, using a
shared `<ListSearch>` input component (`src/components/list-search.tsx`).

### Weight schemes page redesign

The Weight Schemes page used to render every scheme as a full table
taking up the whole page — with several schemes, that meant a lot of
scrolling just to find one. Both the coordinator's and faculty's Weight
Schemes pages now use a shared `<SchemeList>` component
(`src/app/coordinator/weight-schemes/scheme-list.tsx`) where each scheme
is a single compact summary row (name, default badge, creator,
project count, per-semester totals) that expands into the full
component-by-component breakdown table only when clicked — combined
with the search box above, this makes the page usable with any number
of schemes.

### Faculty can add students

Previously only a coordinator could add student records
(`/coordinator/students`). Faculty now have their own **Students** page
(`/students`, linked from the dashboard header) using the same form and
table components, so a faculty member can add a student they're about
to supervise without waiting on the coordinator. `createStudent` accepts
any authenticated user now, not just a coordinator
(`src/lib/actions/students.ts`) — a student record isn't owned by
whoever created it, so this doesn't change who can *use* a student
(anyone can still add any student to any project they're allowed to
edit).

### Timestamps shown in Pakistan Time

Every displayed date/time (comment timestamps, phase "last updated",
proposal due/submitted dates, print-report generation date, faculty/session
"created" dates) is now formatted with an explicit `Asia/Karachi` timezone
via `formatDate`/`formatDateTime` helpers in `src/lib/dates.ts`, instead of
relying on the server's local timezone (Vercel's Node runtime defaults to
UTC, which was showing every timestamp several hours off for users in
Pakistan). Storage is unaffected — every `DateTime` column stays UTC in the
database; only the display formatting changed.

### Deleting a comment

Either the comment's own author or a coordinator can delete a project
comment/thread entry — not just the author, and not just the coordinator.
`deleteProjectComment` (`src/lib/actions/comments.ts`) re-checks this
server-side regardless of what the UI shows, and the "Delete" link only
appears next to a comment when the current viewer is allowed to remove it
(`src/app/projects/[id]/comment-thread.tsx`,
`delete-comment-button.tsx`).

### Multi-week / multi-phase marks

Previously the **Weekly meetings** and **SDLC / research phase completion**
components each had a single mark entry per student per semester, with no
way to record that a project had multiple weekly meetings or that a
component is really several distinct sub-phases. Both are now split into
several per-unit entries:

- **Weekly meetings** — a weight scheme now has a
  `weeklyMeetingWeeks` setting (default 14, editable when creating a
  scheme in `/coordinator/weight-schemes`), and the component's configured
  max marks for a semester are divided evenly across that many weeks
  (Week 1, Week 2, …). Faculty mark each week separately as the semester
  progresses instead of entering one lump number at the end.
- **SDLC / research phase completion** — each SDLC phase (Requirements,
  Design, Implementation, Testing, Deployment/Maintenance) or, for
  research projects, each of the 7 research phases (Problem Definition,
  EDA, Data Engineering & Preprocessing, Experimental Setup & Model
  Design, Training/Optimization/Iterative Testing, Validation & Results
  Synthesis, Thesis Writing) now gets its own mark, again as an even
  share of the component's configured semester max. This reuses the same
  phase list faculty already track completion against, so the phases you
  can mark are always exactly the phases you can check off.

Schema-wise, `Mark` gained `weekNumber` and `phaseKey` columns (both
default to a "not applicable" sentinel — `0` and `""` — for every other,
still-single-entry component: Timely proposal submission, Plagiarism,
Thesis quality), and its unique constraint now includes both columns so a
project can hold one row per (student, semester, component, week/phase)
instead of one row per (student, semester, component). The `ResearchPhase`
enum was also replaced with the 7-phase list above (it previously listed
Literature Review / Data Collection / Methodology / Analysis).

The marks grid (`/projects/[id]`) shows Weekly meetings and SDLC/research
phase as an expandable cell — a summary line ("N/M entered", running
total) that opens into a per-week or per-phase list to enter or edit each
one individually. The award-list CSV downloads and the printable project
report both sum all of a component's per-week/per-phase marks into that
component's single column/total, and the report always shows the full
configured max for a component (not just the sum of whichever
weeks/phases have been entered so far), so a partially-marked component
doesn't display as if it were complete.

**This is a schema migration** — run `npm run db:migrate` (which also
regenerates the Prisma Client) against your real database after pulling
this change, the same way you did for previous feature batches. If you
still get a "Property does not exist on type 'PrismaClient'" build error
afterwards, run `npm run db:generate` again.

### Removing a mark (and unblocking project deletion)

There was previously no way to actually remove a mark once entered — the
marks grid could only create or update one, and a blank input was
rejected outright ("Enter a mark."). That meant a project with any marks
recorded could never be deleted: `deleteProject` refuses to delete a
project with recorded marks (on purpose, as a guard against losing
grading history by accident), but there was no way to get that count
back down to zero.

Every entered mark (a simple component, or one week/phase inside an
expanded Weekly meetings / SDLC-phase cell) now has a **Remove mark**
link beneath it, which deletes that mark row outright after a
confirmation prompt (`deleteMark` in `src/lib/actions/marks.ts`). A mark
of `0` is a real, deliberately-awarded score and still counts as
recorded — it is never treated as equivalent to "no mark" — so removing
a mark always means deleting its row, not zeroing it out. Once every
mark on a project has been removed this way, its recorded-marks count
drops to zero and the project can be deleted normally.

### Deleting a student

Both a coordinator and any faculty member can now delete a student record
from the Students table (`/coordinator/students` and `/students`), using
the same `Delete` link and inline confirmation used elsewhere in the app.
`deleteStudent` (`src/lib/actions/students.ts`) uses the same
authorization as creating a student — any authenticated user, since a
student record isn't owned by whoever added it.

A student who is still a member of any project can't be deleted (a clear
message says so instead of a raw database error) — the
Student&nbsp;&harr;&nbsp;ProjectMember/Mark relations aren't
cascading deletes, so remove the student from their project(s) first
(via that project's edit page) before deleting the record itself.

### Performance on Vercel + Neon

The app felt laggy in production, traced to how it talks to Neon's
serverless Postgres rather than to the queries themselves:

- **Pooled vs. direct connection string.** Neon gives you two connection
  strings — a direct one and a pooled one (through PgBouncer, hostname
  contains `-pooler`). On Vercel, each request can run in its own
  short-lived serverless function; using the *direct* string means every
  cold instance opens a brand-new physical connection to Postgres, which
  is slow and can hit connection limits under load. **If your
  `DATABASE_URL` doesn't contain `-pooler` and `pgbouncer=true`, switch to
  the pooled string from Neon's dashboard** — see the updated Deployment
  section above. This is almost always the biggest lever.
- `src/lib/prisma.ts` now passes explicit pool options to
  `@prisma/adapter-pg` (`max: 3`, plus idle/connection timeouts) instead
  of leaving `pg`'s defaults in place, so each serverless instance holds
  only a handful of connections rather than an unbounded number.
- The project detail page (`/projects/[id]`, the most-visited route) was
  running its project query and its comments query one after another;
  they're independent, so they now run concurrently with `Promise.all`,
  roughly halving that page's database wall-clock time.
- Several `include`s that pulled every column of a relation (`marks:
  true` on the project page and both award-list CSV routes) were
  narrowed to `select`s naming only the fields actually used, cutting the
  amount of data Neon has to serialize and send back per request.
- `updateProject`'s supervisor/session validation lookups (only relevant
  when a coordinator changes either) now also run concurrently instead
  of sequentially.

None of this changes behavior — it's the same data, same validation,
same authorization, just fewer and lighter round-trips to the database.

### Removing a student from a project

A project's student checklist, on its edit page
(`/projects/[id]/edit`), was already meant to let you uncheck a student
to remove them — but editing required at least one student to always
remain selected, so if a project had only one student (the common case)
unchecking them was silently rejected. This is fixed: editing a project
no longer requires any minimum number of students, so a project can be
saved with zero students assigned (e.g. while reassigning, or so the
student record can then be deleted — [deleting a
student](#deleting-a-student) still requires them to not be on any
project). Creating a new project still requires at least one student, as
before.

### Session length

Sessions expire 1 hour after login (a fixed expiry, not sliding —
`SESSION_DURATION_SECONDS` in `src/lib/auth.ts`), down from the original
7 days. See the [Auth & sessions](#auth--sessions) section above.

### Sidebar & dashboard redesign

The coordinator console's navigation and both dashboards' headers were
plain white, which looked flat next to the rest of the app. They're now
a consistent dark (`slate-900`) brand surface:

- The coordinator console has a real sidebar (`src/app/coordinator/sidebar-nav.tsx`)
  — fixed-width and full-height on desktop, with an icon
  (`src/components/icons.tsx`) and label per section, and the current
  page highlighted in indigo. On narrow screens it collapses into a dark
  horizontally-scrolling strip instead of switching to a different
  (white) style, so the two breakpoints still read as one design; the
  user's name and account actions move into a small header below the
  strip, since the strip itself has no room for them.
- The faculty dashboard's header was restyled to match the same dark
  surface and branding, and its toolbar (Students / Weight schemes /
  Award list / New project) now sits inside a bordered card with a
  one-line summary ("Supervising N projects · M need attention").
- `LogoutButton` (`src/app/dashboard/logout-button.tsx`) takes a
  `className` prop now, since it renders on both a light background
  (mobile coordinator header) and a dark one (sidebar footer, faculty
  header) that need different styling.

## Database commands

```bash
npm run db:migrate   # create & apply a new migration from schema changes
npm run db:studio    # open Prisma Studio (visual DB browser) at localhost:5555
npm run db:generate  # regenerate the Prisma Client after schema edits
```

## Deployment

This section is the one-time initial setup. For the ongoing checklist —
what to check before/after each push, backups, rollback, and what to do
if a secret is ever accidentally committed — see **`DEPLOYMENT.md`**.

### 1. Create a free Neon Postgres database

1. Go to [neon.tech](https://neon.tech) and sign up (free tier).
2. Click **Create a project**, give it a name (e.g. `project-oversight-portal`).
3. On the project dashboard, click **Connection Details**. Neon shows two
   connection strings — make sure the **"Pooled connection"** toggle is
   **on** before copying (the hostname will contain `-pooler`, and the
   string will end in `&pgbouncer=true`). Vercel functions are
   serverless: every request can run in its own short-lived process, and
   the pooled string routes those through Neon's connection pooler
   instead of each one opening a brand-new direct Postgres connection.
   Using the *unpooled* string here is the single most common cause of a
   Neon-backed app feeling slow (or hitting "too many connections"
   errors) on Vercel.
4. Paste it into your local `.env` as `DATABASE_URL`, then run:
   ```bash
   npm run db:migrate
   ```
   to create all the tables in your Neon database.

### 2. Add environment variables to Vercel

1. In your Vercel project (from Phase 1) go to **Settings → Environment
   Variables**.
2. Add `DATABASE_URL` with the same Neon **pooled** connection string
   (see step 1 above — hostname contains `-pooler`), for the
   **Production**, **Preview**, and **Development** environments. If the
   app is already deployed and feels laggy, double check this: an
   unpooled `DATABASE_URL` is the most common cause.
3. Add `SESSION_SECRET` with a freshly generated random value (do **not**
   reuse the placeholder from `.env.example`):
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   ```
   Use the same value across Production/Preview/Development for now (so a
   session created on one doesn't break when Vercel serves a different
   environment), for all three environments.
4. Redeploy (Vercel → Deployments → ⋯ → Redeploy), or just push a commit —
   `postinstall` will regenerate the Prisma Client automatically during
   Vercel's build.

### 3. Create your production Coordinator account

Once deployed, run the bootstrap script locally but pointed at your Neon
production database (i.e. with your real `.env`'s `DATABASE_URL`):
```bash
npm run create-coordinator -- "Your Name" you@example.com "a-strong-password"
```
Then log in at your live Vercel URL's `/login` page.
