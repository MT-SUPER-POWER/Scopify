"use client";

import { AppBackground } from "@/components/shared/AppBackground";
import { useLoginStatus } from "@/hooks/auth/useLoginStatus";

export default function LibraryLayout({ children }: { children: React.ReactNode }) {
  const isLoggedIn = useLoginStatus();

  return (
    <main className="relative min-h-screen bg-surface-raised px-6 pt-8 pb-28 md:px-10">
      {isLoggedIn ? <AppBackground /> : null}
      <div className="relative z-10 mx-auto w-full max-w-7xl">{children}</div>
    </main>
  );
}
