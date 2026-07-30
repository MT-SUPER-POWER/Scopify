"use client";

import { useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { subscribeRadio } from "@/lib/api/radio";
import { useRequireLoginAction } from "@/lib/hooks/useRequireLoginAction";
import { musicQueryKeys } from "@/lib/query/queryKeys";
import { useUserStore } from "@/store";
import { useI18n } from "@/store/module/i18n";
import type { RadioSubscriptionVariables } from "@/types/radio";

export function invalidateRadioFavoriteCaches(queryClient: QueryClient, userId: number) {
  return Promise.all([
    queryClient.invalidateQueries({
      queryKey: musicQueryKeys.radio.subscriptions(userId),
    }),
    queryClient.invalidateQueries({
      queryKey: musicQueryKeys.library.subscribedPodcasts(userId),
    }),
  ]);
}

export function useRadioFavorite(initialFavorite = false) {
  const { t } = useI18n();
  const requireLoginAction = useRequireLoginAction();
  const queryClient = useQueryClient();
  const userId = useUserStore((state) => state.user?.userId);
  const [isFavorited, setIsFavorited] = useState(initialFavorite);

  useEffect(() => {
    setIsFavorited(initialFavorite);
  }, [initialFavorite]);

  const { isPending, mutateAsync } = useMutation({
    mutationFn: ({ radioId, subscribe }: RadioSubscriptionVariables) =>
      subscribeRadio(radioId, subscribe),
    onMutate: (variables) => {
      setIsFavorited(variables.subscribe);
    },
    onError: (_error, variables) => {
      setIsFavorited(!variables.subscribe);
      toast.error(
        variables.subscribe
          ? t("library.podcasts.toast.favoriteFailed")
          : t("library.podcasts.toast.unfavoriteFailed"),
      );
    },
    onSuccess: (_data, variables) => {
      setIsFavorited(variables.subscribe);
      if (userId) {
        void invalidateRadioFavoriteCaches(queryClient, userId);
      }
      toast.success(
        variables.subscribe
          ? t("library.podcasts.toast.favoriteSuccess")
          : t("library.podcasts.toast.unfavoriteSuccess"),
      );
    },
  });

  const favoriteRadio = useCallback(
    async (radioId: number | string) => {
      await requireLoginAction("library", async () => {
        await mutateAsync({ radioId, subscribe: true });
      });
    },
    [mutateAsync, requireLoginAction],
  );

  const toggleFavorite = useCallback(
    async (radioId: number | string) => {
      await requireLoginAction("library", async () => {
        await mutateAsync({ radioId, subscribe: !isFavorited });
      });
    },
    [isFavorited, mutateAsync, requireLoginAction],
  );

  return { favoriteRadio, isFavorited, isFavoriting: isPending, toggleFavorite };
}
