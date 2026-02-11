"use client";

import { useRouter } from "next/navigation";
import Cookies from "js-cookie";

export default function LoginPage() {
  const router = useRouter();

  async function handleLogin() {
    const res = await fetch("/api/auth/login", { method: "POST" });
    const data = (await res.json()) as { token?: string };
    if (data.token) {
      Cookies.set("token", data.token, { sameSite: "lax", path: "/" });
      router.push("/dashboard");
    }
  }

  return (
    <main className="flex min-h-[40vh] flex-col items-center justify-center px-4">
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
        MediQueue — Login
      </h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        Sign in to access the staff dashboard.
      </p>
      <button
        type="button"
        onClick={handleLogin}
        className="mt-6 rounded-lg bg-emerald-600 px-5 py-2.5 font-medium text-white transition-colors hover:bg-emerald-700"
      >
        Login
      </button>
    </main>
  );
}
