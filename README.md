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
- **ORM:** Prisma
- **Auth:** Auth.js (NextAuth) — credentials-based login for Faculty & Coordinator
- **Email:** Resend
- **Hosting:** Vercel (free tier)

## Development phases

1. **Project scaffold** (this step) — Next.js + Tailwind + GitHub + Vercel
2. Database setup (Neon) + Prisma schema
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
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deployment

See phase-by-phase instructions in the project chat/documentation for
connecting this repo to Vercel and provisioning a free Neon Postgres
database.
