export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-zinc-900 dark:bg-black dark:text-zinc-50">
      <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-12 px-6 py-16 md:px-8 lg:px-10">
        <header className="flex flex-col gap-4 border-b border-zinc-200 pb-8 dark:border-zinc-800">
          <span className="inline-flex w-fit rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium uppercase tracking-wide text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200">
            MediQueue · Sprint 1
          </span>
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
                Digital Queue Management for Tier-2/3 Hospitals
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                Lightweight web-based queueing system where patients generate tokens,
                staff manage queues, and admins monitor hospital flow in real time.
              </p>
            </div>
            <div className="mt-4 flex flex-col items-start gap-1 text-xs text-zinc-500 md:items-end">
              <p className="font-medium text-zinc-700 dark:text-zinc-300">
                Architecture: Next.js App Router + Supabase (HLD / LLD)
              </p>
              <p>Frontend: Next.js 14 · TypeScript · Tailwind CSS</p>
            </div>
          </div>
        </header>

        <section className="grid gap-6 md:grid-cols-3">
          <RoleCard
            title="Patient Portal"
            description="Generate a digital token from a simple form and track live queue position from any phone browser."
            items={[
              "No login required",
              "Token & wait-time summary",
              "Works on low-end devices",
            ]}
          />
          <RoleCard
            title="Staff Portal"
            description="Operational dashboard for counters to call the next patient and manage queue status safely."
            items={[
              "One-click call next",
              "Pause / resume queues",
              "Priority token support",
            ]}
          />
          <RoleCard
            title="Admin Portal"
            description="Configuration and analytics for hospital admins to understand patient flow and peak hours."
            items={[
              "Department & staff setup",
              "Daily queue metrics",
              "Future analytics module",
            ]}
          />
        </section>

        <section className="grid gap-6 rounded-2xl border border-dashed border-zinc-200 bg-white/70 p-6 text-sm dark:border-zinc-800 dark:bg-zinc-950/60 md:grid-cols-[1.4fr,1fr]">
          <div className="space-y-3">
            <h2 className="text-base font-semibold tracking-tight">
              Project structure (App Router)
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400">
              The base project follows a simple, scalable layout that maps directly to our
              High Level Design (HLD) and Low Level Design (LLD) documents.
            </p>
            <pre className="overflow-x-auto rounded-xl bg-zinc-950/90 p-4 text-xs text-zinc-100 dark:bg-zinc-900">
{`src/
  app/         # Routes, layouts & API (Next.js App Router)
  components/  # Reusable UI (forms, layouts, widgets)
  lib/         # Config, helpers, type-safe utilities`}
            </pre>
          </div>
          <div className="space-y-3 rounded-xl bg-zinc-50 p-4 dark:bg-zinc-900/60">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Sprint 1 scope
            </h3>
            <ul className="space-y-2 text-xs text-zinc-600 dark:text-zinc-300">
              <li>✔️ Next.js 14 + TypeScript + Tailwind base app</li>
              <li>✔️ Clean `src/app`, `src/components`, and `src/lib` hierarchy</li>
              <li>✔️ Documentation aligned with MediQueue HLD / LLD</li>
            </ul>
          </div>
        </section>

        <footer className="mt-auto border-t border-zinc-200 pt-4 text-xs text-zinc-500 dark:border-zinc-800">
          <p>
            Built by team MediQueue to digitize hospital queues for Tier-2/3 cities. This
            sprint focuses on a production-ready foundation; future sprints will plug in
            Supabase, SMS gateways, and real-time updates described in the LLD.
          </p>
        </footer>
      </main>
    </div>
  );
}

type RoleCardProps = {
  title: string;
  description: string;
  items: string[];
};

function RoleCard({ title, description, items }: RoleCardProps) {
  return (
    <article className="flex flex-col justify-between rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm shadow-zinc-100 dark:border-zinc-800 dark:bg-zinc-950 dark:shadow-none">
      <div className="space-y-2">
        <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
        <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
          {description}
        </p>
      </div>
      <ul className="mt-4 space-y-1.5 text-xs text-zinc-700 dark:text-zinc-300">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2">
            <span className="mt-[3px] h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}
