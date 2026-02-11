"use client";

import type { ReactNode } from "react";
import { AuthProvider } from "./AuthContext";
import { UIProvider } from "./UIContext";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <UIProvider>{children}</UIProvider>
    </AuthProvider>
  );
}
