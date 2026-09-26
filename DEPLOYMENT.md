# Deployment checklist

This is the ongoing operational checklist for running the Project
Oversight Portal in production. For the one-time initial setup (creating
the Neon database, wiring up Vercel, the first Coordinator account), see
the **Deployment** section in `README.md` instead — this file picks up
from there.

## Before your first real semester on this

- [ ] `DATABASE_URL` and `SESSION_SECRET` are set in Vercel for
      **Production** (Settings → Environment Variables) — not just typed
      into your local `.env`. A value only in your local `.env` never
      reaches the deployed app.
- [ ] `SESSION_SECRET` is a real random value, not the placeholder from
      `.env.example`. Generate one with:
      ```bash
      node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
      ```
- [ ] You've created your production Coordinator account against the
      **Neon** database (not your local Postgres, if you ever set one up
      for testing) — see README's "Create your production Coordinator
      account" step.
- [ ] You can log in at your live Vercel URL and see the Coordinator
      dashboard.
- [ ] `.env` is **not** committed to git — check with:
      ```bash
      git ls-files | grep "^\.env$"
      ```
      This should print nothing. If it prints `.env`, stop and see
      "If you accidentally committed a secret" below before doing anything
      else.

## Before every push (a 30-second sanity check)

- [ ] `npm run build` succeeds locally with no TypeScript errors. Vercel
      runs the same build — catching a failure locally is much faster
      than waiting for a failed Vercel deploy.
- [ ] You're not committing test/scratch files (`seed-test.ts`,
      `e2e-test.mjs`, or similar) — `git status` should only show the
      files you actually meant to change.
- [ ] If you changed `prisma/schema.prisma`, you ran
      `npm run db:migrate` locally first and the migration is committed
      under `prisma/migrations/` — Vercel does **not** run migrations for
      you automatically; you apply them yourself, the same way, against
      your Neon database, before or right after the code that depends on
      them goes live.

## After every deploy

- [ ] Open the live URL and check the Vercel **Deployments** tab shows
      "Ready" (green), not "Error".
- [ ] Spot-check one real page load (e.g. `/dashboard` or `/coordinator`)
      to confirm the database connection still works — a successful build
      doesn't guarantee `DATABASE_URL` is reachable at runtime.

## Backups

Neon's free tier keeps a rolling history of your database (point-in-time
restore), separate from anything in this repo:

- [ ] In the Neon dashboard, check **Backups / Restore** (naming varies by
      Neon's current UI) to see how far back you can currently restore to
      on the free tier — this changes over time, so re-check it
      periodically rather than assuming.
- [ ] Before a risky change (deleting a lot of data, a schema change you're
      unsure about), note the current timestamp so you know what point to
      restore to if something goes wrong.
- [ ] This app has no separate export/backup script of its own — Neon's
      built-in restore is the safety net. If you want an extra copy you
      control, Neon also supports a plain `pg_dump` against your
      connection string from any machine with `psql`/`pg_dump` installed.

## Rollback (undoing a bad deploy)

If a push breaks production:

1. Go to Vercel → your project → **Deployments**.
2. Find the last deployment that was working (it'll say "Ready" and have
   an older timestamp).
3. Click its **⋯** menu → **Promote to Production** (wording may vary
   slightly by Vercel's current UI). This instantly points your live URL
   back at the old build — no git revert needed for the app code itself.
4. If the bad deploy also included a database migration, promoting the
   old build does **not** undo the migration — the database and the code
   version can drift apart. For a schema change, plan the rollback
   direction (a corresponding "down" migration, or restoring from a Neon
   backup) before you apply the migration in the first place, not after
   something breaks.
5. Once you've fixed the issue in a new commit, push normally — Vercel
   will build and deploy it, and you can promote back to the latest
   deployment once you've confirmed it works.

## Custom domain (optional)

You don't need a custom domain for the app to work — the free
`your-project.vercel.app` URL is a fully working production URL. A custom
domain is only worth the cost if you want a university-branded URL, or if
you later want Phase 8 (email notifications via Resend) — Resend requires
verifying a domain you own before it can send email, and a `.vercel.app`
URL doesn't qualify for that (Vercel owns that domain, not you).

If/when you do get one:
1. Vercel → your project → **Settings → Domains** → add your domain and
   follow its DNS instructions (usually one CNAME or A record with your
   registrar).
2. No code or environment variable changes are needed — the app doesn't
   hardcode its own URL anywhere.

## If you accidentally committed a secret

If `.env` (or any real `DATABASE_URL`/`SESSION_SECRET`) ever ends up
committed to git, treat the secret as compromised — removing it from a
later commit does **not** remove it from git history, which anyone with
repo access (or a public GitHub repo, anyone at all) can still read.

1. Immediately rotate it:
   - Neon dashboard → reset your database password / regenerate the
     connection string → update `DATABASE_URL` in Vercel.
   - Generate a fresh `SESSION_SECRET` the same way as above → update it
     in Vercel. (This will log out everyone with an active session —
     expected and fine.)
2. Remove the file from git tracking going forward:
   ```bash
   git rm --cached .env
   git commit -m "Remove .env from version control"
   ```
   (`.env` is already in `.gitignore`, so this only matters if it was
   force-added at some point.)
3. Rewriting git history to scrub the old commit entirely (e.g. with
   `git filter-repo`) is possible but disruptive on a shared repo — for a
   small, mostly-private class project, rotating the secret (step 1) is
   usually enough; treat history-scrubbing as optional hardening, not a
   substitute for rotation.
