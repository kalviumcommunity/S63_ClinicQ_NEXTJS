"use client";

import Link from "next/link";

const SIDEBAR_LINKS = [
  { href: "/dashboard", label: "Overview" },
  { href: "/users", label: "Users" },
  { href: "/dashboard", label: "Settings" },
] as const;

export default function Sidebar() {
  return (
    <aside
      className="flex h-full w-64 flex-col border-r border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950"
      aria-label="Sidebar"
    >
      <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        Navigation
      </h2>
      <ul className="space-y-1">
        {SIDEBAR_LINKS.map((link) => (
          <li key={link.href + link.label}>
            <Link
              href={link.href}
              className="block rounded-md px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-200 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}
