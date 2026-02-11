"use client";

import type { ReactNode } from "react";
import { useUI } from "@/hooks/useUI";
import Header from "./Header";
import Sidebar from "./Sidebar";

type LayoutWrapperProps = {
  children: ReactNode;
};

export default function LayoutWrapper({ children }: LayoutWrapperProps) {
  const { sidebarOpen } = useUI();

  return (
    <div className="flex h-screen flex-col">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <div
          className={`shrink-0 overflow-hidden transition-[width] duration-200 ${
            sidebarOpen ? "w-64" : "w-0"
          }`}
        >
          <Sidebar />
        </div>
        <main
          className="flex-1 overflow-auto bg-white p-6 dark:bg-zinc-50"
          id="main-content"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
