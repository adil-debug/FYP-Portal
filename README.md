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
- **Auth:** Auth.js (NextAuth) — credentials-based login for Faculty & Coordinator
- **Email:** Resend
- **Hosting:** Vercel (free tier)

## Development phases

1. **Project scaffold** — Next.js + Tailwind + GitHub + Vercel
2. **Database setup** (this step) — Neon Postgres + Prisma schema
3. Authentication (Coordinator / Faculty roles)
4. Coordinator features (create faculty & student accounts, default weight scheme)
5. Project creation & assignment
6. SDLC / research phase tracking UI
7. Marks entry (per student, per component, per semester)
8. Email notifications on mark updates
9. Dashboards (faculty view, coordinator view)
10. UI polish & deployment finalization

## Getting started locally

```bash
npm install          # also runs `prisma generate` via postinstall
cp .env.example .env # then fill in your real Neon DATABASE_URL
npm run db:migrate   # creates tables from prisma/schema.prisma
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

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

### 2. Add the same variable to Vercel

1. In your Vercel project (from Phase 1) go to **Settings → Environment
   Variables**.
2. Add `DATABASE_URL` with the same Neon connection string, for the
   **Production**, **Preview**, and **Development** environments.
3. Redeploy (Vercel → Deployments → ⋯ → Redeploy), or just push a commit —
   `postinstall` will regenerate the Prisma Client automatically during
   Vercel's build.
