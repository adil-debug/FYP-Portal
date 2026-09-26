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
8. **Email notifications on mark updates — skipped for now.** Resend (the
   email provider) requires verifying a domain you own before it can send
   to real recipients; a Vercel `.vercel.app` URL doesn't qualify, since
   Vercel owns that domain, not you. Since buying a domain isn't a cost the
   user wants to take on right now, this phase is deliberately deferred,
   not forgotten — it can be picked up later once a domain is available,
   without changing anything already built.
9. **Dashboards** (this step) — marks progress, at-risk flags, coordinator
   marks overview, simple charts, downloadable award lists
10. UI polish & deployment finalization

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
  `sameSite=lax` cookie named `portal_session`, valid for 7 days.
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

## Database commands

```bash
npm run db:migrate   # create & apply a new migration from schema changes
npm run db:studio    # open Prisma Studio (visual DB browser) at localhost:5555
npm run db:generate  # regenerate the Prisma Client after schema edits
```

## Deployment

### 1. Create a free Neon Postgres database

1. Go to [neon.tech](https://neon.tech) and sign up (free tier).
2. Click **Create a project**, give it a name (e.g. `project-oversight-portal`).
3. On the project dashboard, click **Connection Details** and copy the
   **connection string** (it looks like
   `postgresql://<user>:<password>@<host>/<db>?sslmode=require`).
4. Paste it into your local `.env` as `DATABASE_URL`, then run:
   ```bash
   npm run db:migrate
   ```
   to create all the tables in your Neon database.

### 2. Add environment variables to Vercel

1. In your Vercel project (from Phase 1) go to **Settings → Environment
   Variables**.
2. Add `DATABASE_URL` with the same Neon connection string, for the
   **Production**, **Preview**, and **Development** environments.
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
