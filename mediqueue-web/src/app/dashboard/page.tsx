"use client";

import { useState } from "react";
import { Button, Card } from "@/components";
import { useAuth } from "@/hooks/useAuth";
import type { Role } from "@/config/roles";

export default function DashboardPage() {
  const { user, role } = useAuth();
  const [status, setStatus] = useState<string | null>(null);

  const userRole: Role | "guest" =
    role ?? (user ? "viewer" : "guest");

  async function handleDeleteDemo() {
    setStatus("Checking permissions...");
    const res = await fetch("/api/admin/delete-demo", { method: "POST" });
    const data = (await res.json()) as { message?: string; error?: string };
    setStatus(data.message ?? data.error ?? "Unknown response");
  }

  return (
    <main className="flex min-h-[40vh] flex-col items-center justify-center px-4">
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
        Dashboard
      </h1>
      <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
        Only logged-in users can see this page.
      </p>

      <Card className="mt-6 max-w-md space-y-3">
        <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
          Role-based actions
        </h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Current role: <span className="font-medium">{userRole}</span>
        </p>
        <div className="flex flex-wrap gap-2">
          {userRole === "admin" && (
            <Button label="Delete (admin only)" onClick={handleDeleteDemo} />
          )}
          {["admin", "operator"].includes(userRole) && (
            <Button
              label="Edit (admin/operator)"
              variant="secondary"
            />
          )}
          <Button label="View (all)" variant="secondary" />
        </div>
        {status && (
          <p className="text-xs text-zinc-600 dark:text-zinc-300">
            {status}
          </p>
        )}
      </Card>
    </main>
  );
}
