"use client";

import Link from "next/link";

export default function Header() {
  return (
    <header
      className="flex w-full items-center justify-between border-b border-zinc-200 bg-emerald-600 px-4 py-3 text-white dark:border-zinc-800"
      role="banner"
    >
      <h1 className="text-lg font-semibold">
        <Link href="/" className="hover:opacity-90">
          MediQueue
        </Link>
      </h1>
      <nav className="flex flex-wrap items-center gap-4" aria-label="Main">
        <Link
          href="/"
          className="text-sm font-medium text-white/90 hover:text-white"
        >
          Home
        </Link>
        <Link
          href="/login"
          className="text-sm font-medium text-white/90 hover:text-white"
        >
          Login
        </Link>
        <Link
          href="/dashboard"
          className="text-sm font-medium text-white/90 hover:text-white"
        >
          Dashboard
        </Link>
        <Link
          href="/users"
          className="text-sm font-medium text-white/90 hover:text-white"
        >
          Users
        </Link>
      </nav>
    </header>
  );
}
