"use client";

import { useQuery } from "@tanstack/react-query";
import { getRecentSongsByID } from "@/lib/api/user";
import { toListeningRank } from "@/lib/profile/listeningRank";
import { socialKey } from "@/lib/social/cache";
import { useSocialAccount } from "@/hooks/social/useSocialQueries";
import type { ListeningRankPeriod } from "@/types/user/profile";

export function useUserListeningRank(uid: string, period: ListeningRankPeriod) {
  const { account } = useSocialAccount();
  return useQuery({
    queryKey: socialKey(account, "listening-rank", uid, period),
    queryFn: async () => {
      const { data } = await getRecentSongsByID(Number(uid), period === "week" ? 1 : 0);
      return toListeningRank(data, period);
    },
    enabled: /^\d+$/.test(uid),
    staleTime: 5 * 60_000,
    retry: 1,
  });
}
