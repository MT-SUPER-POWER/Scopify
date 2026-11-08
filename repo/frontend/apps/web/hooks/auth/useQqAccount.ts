"use client";

import { queryOptions, useQuery } from "@tanstack/react-query";

import { useHasQqSession } from "@/hooks/auth/useQqSession";
import { toQqAccountProfile } from "@/lib/providers/qq/adapters/account";
import { getQqLoginStatus } from "@/lib/providers/qq/api/login";
import { notifyExpiredQqSession } from "@/lib/query/session";
import { providerQueryKey } from "@/lib/query/providerQueryKey";
import { ApiError } from "@/lib/web/apiError";

const QQ_ACCOUNT_STALE_TIME_MS = 10 * 60 * 1000;

/** The QQ login status call; a reply without a profile means the stored session is not valid. */
export const qqAccountQueryOptions = queryOptions({
  queryKey: providerQueryKey("qq", "account", "profile"),
  queryFn: async ({ signal }) => {
    const status = await getQqLoginStatus(signal);
    const profile = toQqAccountProfile(status.data?.profile);
    if (!profile) {
      notifyExpiredQqSession();
      throw new ApiError({
        kind: "unauthenticated",
        message: "QQ Music session is not valid",
        status: 401,
      });
    }
    return profile;
  },
  meta: { persist: false, scope: "account" },
  staleTime: QQ_ACCOUNT_STALE_TIME_MS,
});

/** The signed-in QQ account; idle while no QQ session is stored. */
export function useQqAccount() {
  const hasSession = useHasQqSession();
  return useQuery({ ...qqAccountQueryOptions, enabled: hasSession });
}
