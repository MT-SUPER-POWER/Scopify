import type React from "react";

export function LibraryStatePage({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-surface-raised px-6 pt-8 pb-28 md:px-10">{children}</main>
  );
}
