"use client";

import { useQuery } from "@tanstack/react-query";
import { getSubscribedRadios } from "@/lib/api/radio";
import { useLoginStatus } from "@/lib/hooks/useLoginStatus";
import { musicQueryKeys } from "@/lib/query/queryKeys";
import { useUserStore } from "@/store";

export function getSubscribedRadioIds(
  response: Awaited<ReturnType<typeof getSubscribedRadios>>["data"],
) {
  return (response.data?.djRadios ?? response.djRadios ?? []).map((radio) => String(radio.id));
}

export function isSubscribedRadio(subscriptionIds: unknown, radioId: string) {
  return Array.isArray(subscriptionIds) && subscriptionIds.includes(radioId);
}

export function isRadioSubscriptionLoading(
  isLoggedIn: boolean,
  userId: number | undefined,
  isPending: boolean,
) {
  return isLoggedIn && Boolean(userId) && isPending;
}

export function useRadioSubscriptionsQuery() {
  const isLoggedIn = useLoginStatus();
  const userId = useUserStore((state) => state.user?.userId);
  const query = useQuery({
    enabled: isLoggedIn && Boolean(userId),
    meta: {
      persist: true,
      scope: "account",
    },
    queryFn: async () => getSubscribedRadioIds((await getSubscribedRadios()).data),
    queryKey: musicQueryKeys.radio.subscriptions(userId ?? 0),
  });

  return {
    ...query,
    isLoading: isRadioSubscriptionLoading(isLoggedIn, userId, query.isPending),
  };
}
