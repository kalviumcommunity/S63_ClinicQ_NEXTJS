"use client";

import Link from "next/link";
import Cookies from "js-cookie";
import { useAuth } from "@/hooks/useAuth";
import { useUI } from "@/hooks/useUI";
import { Button } from "@/components";

export default function Header() {
  const { user, logout, isAuthenticated } = useAuth();
  const { theme, toggleTheme, sidebarOpen, toggleSidebar } = useUI();

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
      <nav
        className="flex flex-wrap items-center gap-3 sm:gap-4"
        aria-label="Main"
      >
        <Link
          href="/"
          className="text-sm font-medium text-white/90 hover:text-white"
        >
          Home
        </Link>
        {!isAuthenticated && (
          <Link
            href="/login"
            className="text-sm font-medium text-white/90 hover:text-white"
          >
            Login
          </Link>
        )}
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
        {isAuthenticated && user && (
          <span className="text-sm text-white/90" title="Logged in">
            {user.name} ({user.role})
          </span>
        )}
        {isAuthenticated && (
          <Button
            label="Logout"
            onClick={() => {
              Cookies.remove("token", { path: "/" });
              logout();
            }}
            variant="secondary"
            className="bg-white/20! text-white! hover:bg-white/30!"
          />
        )}
        <Button
          label={theme === "dark" ? "Light" : "Dark"}
          onClick={toggleTheme}
          variant="secondary"
          className="bg-white/20! text-white! hover:bg-white/30!"
        />
        <Button
          label={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
          onClick={toggleSidebar}
          variant="secondary"
          className="bg-white/20! text-white! hover:bg-white/30!"
        />
      </nav>
    </header>
  );
}
