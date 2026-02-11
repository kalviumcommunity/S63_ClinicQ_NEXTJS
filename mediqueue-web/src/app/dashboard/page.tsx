export default function DashboardPage() {
  return (
    <main className="flex min-h-[40vh] flex-col items-center justify-center px-4">
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
        Dashboard
      </h1>
      <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
        Only logged-in users can see this page.
      </p>
    </main>
  );
}
