import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-[50vh] flex-col items-center justify-center px-4 text-center">
      <h1 className="text-2xl font-bold text-red-600 dark:text-red-400">
        404 — Page Not Found
      </h1>
      <p className="mt-3 text-zinc-600 dark:text-zinc-400">
        Oops! This route doesn&apos;t exist.
      </p>
      <Link
        href="/"
        className="mt-6 rounded-lg bg-zinc-200 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-50 dark:hover:bg-zinc-600"
      >
        Back to Home
      </Link>
    </main>
  );
}
