"use client";

import { AppBackground } from "@/components/shared/AppBackground";
import { useLoginStatus } from "@/hooks/auth/useLoginStatus";

export function LoggedInBackground() {
  const isLoggedIn = useLoginStatus();

  return isLoggedIn ? <AppBackground /> : null;
}
