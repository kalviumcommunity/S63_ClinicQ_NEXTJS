import type { ReactNode } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";

type LayoutWrapperProps = {
  children: ReactNode;
};

export default function LayoutWrapper({ children }: LayoutWrapperProps) {
  return (
    <div className="flex h-screen flex-col">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
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
