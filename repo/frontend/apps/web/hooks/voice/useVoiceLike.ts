"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { useLikedVoicesQuery } from "@/hooks/library/useLibraryQueries";
import { toggleVoiceLike } from "@/lib/api/voicelist";
import { useRequireLoginAction } from "@/lib/hooks/useRequireLoginAction";
import { musicQueryKeys } from "@/lib/query/queryKeys";
import { useUserStore } from "@/store";
import { useI18n } from "@/store/module/i18n";

export function useVoiceLike(voiceId: null | number, initialLiked = false) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const requireLoginAction = useRequireLoginAction();
  const userId = useUserStore((state) => state.user?.userId);
  const likedVoices = useLikedVoicesQuery(voiceId !== null);
  const remoteLiked = likedVoices.data?.some((voice) => voice.id === voiceId);
  const [isLiked, setIsLiked] = useState(remoteLiked ?? initialLiked);

  useEffect(() => {
    setIsLiked(remoteLiked ?? initialLiked);
  }, [initialLiked, remoteLiked]);

  const mutation = useMutation({
    mutationFn: (nextLiked: boolean) => {
      if (voiceId === null) throw new Error("A voice ID is required to update its like state.");
      return toggleVoiceLike(voiceId, nextLiked);
    },
    onMutate: (nextLiked) => setIsLiked(nextLiked),
    onError: (_error, nextLiked) => {
      setIsLiked(!nextLiked);
      toast.error(t("library.voice.likeFailed"));
    },
    onSuccess: (_data, nextLiked) => {
      setIsLiked(nextLiked);
      if (userId) {
        void queryClient.invalidateQueries({
          queryKey: musicQueryKeys.library.likedVoices(userId),
        });
      }
      toast.success(nextLiked ? t("library.voice.likeSuccess") : t("library.voice.unlikeSuccess"));
    },
  });

  const toggleLike = useCallback(async () => {
    if (voiceId === null) return false;
    let updated = false;
    await requireLoginAction(async () => {
      await mutation.mutateAsync(!isLiked);
      updated = true;
    });
    return updated;
  }, [isLiked, mutation, requireLoginAction, voiceId]);

  return { isLiked, isLiking: mutation.isPending, toggleLike };
}
