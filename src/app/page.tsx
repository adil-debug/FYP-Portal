export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
              PO
            </div>
            <span className="text-lg font-semibold tracking-tight text-slate-900">
              Project Oversight Portal
            </span>
          </div>
          <nav className="flex items-center gap-3 text-sm font-medium text-slate-600">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Phase 1 · Scaffold
            </span>
          </nav>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-start justify-center gap-6 px-6 py-24">
        <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-600">
          BS Computer Science &middot; Final Year Project Oversight
        </span>
        <h1 className="max-w-2xl text-4xl font-bold leading-tight tracking-tight text-slate-900 sm:text-5xl">
          Track FYP progress, SDLC phases, and marks &mdash; in one place.
        </h1>
        <p className="max-w-xl text-lg leading-relaxed text-slate-600">
          A dedicated portal for faculty and the FYP coordinator to oversee
          undergraduate project proposals, weekly meetings, SDLC/research
          milestones, plagiarism checks, and thesis quality across both
          final-year semesters.
        </p>
        <div className="flex gap-3 pt-2">
          <div className="rounded-lg bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm">
            Coming in Phase 3: Login
          </div>
          <div className="rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700">
            Coming in Phase 2: Database
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-400">
        Project Oversight Portal &mdash; Internal tool for Faculty &amp; FYP Coordinator use
      </footer>
    </div>
  );
}
