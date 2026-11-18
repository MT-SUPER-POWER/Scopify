"use client";

import type { MusicProvider } from "@scopify/music-domain/identity";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import {
  clearRequestedLoginPlatform,
  isMusicProvider,
  peekRequestedLoginPlatform,
} from "@/lib/auth/loginPlatform";
import { useActiveProviderStore } from "@/store/module/provider";

/**
 * Which platform the login page logs into: `?provider=`, then the platform an entry asked for,
 * then the active platform, which is NetEase while signed out. Resolved on the first render so
 * the NetEase flow never sees a stale choice.
 */
export function useLoginPlatform() {
  const searchParams = useSearchParams();
  const [platform, setPlatform] = useState<MusicProvider>(() => {
    const fromUrl = searchParams.get("provider");
    if (isMusicProvider(fromUrl)) return fromUrl;
    return peekRequestedLoginPlatform() ?? useActiveProviderStore.getState().activeProvider;
  });

  useEffect(() => clearRequestedLoginPlatform(), []);

  return { platform, setPlatform };
}
