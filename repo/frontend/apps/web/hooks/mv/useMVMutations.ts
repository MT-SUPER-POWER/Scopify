"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/auth/useAuth";
import { subscribeMV, toggleLikeMV } from "@/lib/api/mv";
import { musicQueryKeys } from "@/lib/query/queryKeys";
import type { MvLikeVariables, MvSubscriptionVariables } from "@/types/mv/model";

export function useMVSubscriptionMutation() {
  const { accountId } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: musicQueryKeys.mv.subscribeMutation(accountId ?? ""),
    onMutate: () => {
      if (!accountId) throw new Error("An authenticated music account is required.");
      return { accountId };
    },
    mutationFn: async ({ mvid, subscribe }: MvSubscriptionVariables) =>
      (await subscribeMV(mvid, subscribe)).data,
    onSuccess: async (_data, { mvid }, context) => {
      if (!context) return;
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: musicQueryKeys.mv.subscriptions(context.accountId),
        }),
        queryClient.invalidateQueries({
          queryKey: musicQueryKeys.mv.detail(mvid, context.accountId),
        }),
      ]);
    },
    meta: { scope: "account" },
  });
}

export function useMVLikeMutation() {
  const { accountId } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: musicQueryKeys.mv.likeMutation(accountId ?? ""),
    onMutate: () => {
      if (!accountId) throw new Error("An authenticated music account is required.");
      return { accountId };
    },
    mutationFn: async ({ mvid, liked }: MvLikeVariables) => (await toggleLikeMV(mvid, liked)).data,
    onSuccess: async (_data, { mvid }, context) => {
      if (!context) return;
      await queryClient.invalidateQueries({
        queryKey: musicQueryKeys.mv.info(mvid, context.accountId),
      });
    },
    meta: { scope: "account" },
  });
}
