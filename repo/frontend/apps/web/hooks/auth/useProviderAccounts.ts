"use client";

import { useLoginStatus } from "@/hooks/auth/useLoginStatus";
import { useQqAccount } from "@/hooks/auth/useQqAccount";
import { useHasQqSession } from "@/hooks/auth/useQqSession";
import { useActiveProviderStore } from "@/store/module/provider";
import { useUserStore } from "@/store/module/user";
import type { ProviderAccountState } from "@/types/auth/account";

/** Both platforms' login state, NetEase first; each keeps its own session. */
export function useProviderAccounts(): readonly ProviderAccountState[] {
  const neteaseLoggedIn = useLoginStatus();
  const neteaseUser = useUserStore((state) => state.user);
  const qqLoggedIn = useHasQqSession();
  const qqAccount = useQqAccount();

  return [
    {
      provider: "netease",
      isLoggedIn: neteaseLoggedIn,
      ...(neteaseLoggedIn && neteaseUser
        ? {
            profile: {
              provider: "netease",
              accountId: String(neteaseUser.userId),
              nickname: neteaseUser.nickname,
              ...(neteaseUser.avatarUrl ? { avatarUrl: neteaseUser.avatarUrl } : {}),
            },
          }
        : {}),
    },
    {
      provider: "qq",
      isLoggedIn: qqLoggedIn,
      ...(qqLoggedIn && qqAccount.data ? { profile: qqAccount.data } : {}),
    },
  ];
}

/** The account of the active platform. */
export function useActiveAccount(): ProviderAccountState {
  const activeProvider = useActiveProviderStore((state) => state.activeProvider);
  const accounts = useProviderAccounts();
  return accounts.find((account) => account.provider === activeProvider) ?? accounts[0];
}
