import type { ReactNode } from "react";

type AppShellProps = {
  children: ReactNode;
};

export default function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 antialiased dark:bg-black dark:text-zinc-50">
      {children}
    </div>
  );
}

