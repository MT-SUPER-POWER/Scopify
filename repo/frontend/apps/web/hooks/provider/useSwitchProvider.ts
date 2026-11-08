"use client";

import type { MusicProvider } from "@scopify/music-domain/identity";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useCallback } from "react";

import { createProviderSwitchSteps, switchProvider } from "@/lib/providers/switchProvider";

/** The one action that switches the whole app to another platform (see `switchProvider`). */
export function useSwitchProvider() {
  const queryClient = useQueryClient();
  const router = useRouter();
  return useCallback(
    (target: MusicProvider) =>
      switchProvider(
        target,
        createProviderSwitchSteps(queryClient, () => router.replace("/")),
      ),
    [queryClient, router],
  );
}
