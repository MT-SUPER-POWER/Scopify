"use client";

import type { MusicAccountRef } from "@scopify/music-domain/identity";
import type { MusicProviderClient } from "@scopify/music-domain/provider";
import { useMemo } from "react";

import { useActiveAccount } from "@/hooks/auth/useProviderAccounts";
import { useActiveProvider } from "@/hooks/provider/useActiveProvider";

/**
 * The active platform and its signed-in account. `account` is null while signed out or while a
 * QQ profile is still loading, so library queries wait instead of asking with no account.
 */
export function useLibraryAccount(): {
  account: MusicAccountRef | null;
  provider: MusicProviderClient;
} {
  const provider = useActiveProvider();
  const state = useActiveAccount();
  const accountId = state.isLoggedIn ? state.profile?.accountId : undefined;
  const account = useMemo<MusicAccountRef | null>(
    () =>
      accountId && state.provider === provider.provider
        ? { provider: provider.provider, accountId }
        : null,
    [accountId, provider.provider, state.provider],
  );
  return { account, provider };
}
