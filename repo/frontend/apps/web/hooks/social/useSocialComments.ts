"use client";

import { useIsMutating, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { changeComment, likeComment } from "@/lib/api/social";
import { patchEvent, socialKey } from "@/lib/social/cache";
import { useSocialAccount } from "./useSocialQueries";
import { useI18n } from "@/store/module/i18n";
import type { SocialComment, SocialEvent, SocialCommentDraft } from "@/types/social";
import type { InfiniteData } from "@tanstack/react-query";
import type { SocialCommentPage } from "@/types/social";

export function useSocialCommentWriter(event: SocialEvent) {
  const { account } = useSocialAccount(),
    client = useQueryClient(),
    { t } = useI18n();
  return useMutation({
    mutationFn: (input: SocialCommentDraft) =>
      changeComment({
        threadId: event.threadId,
        text: input.text,
        commentId: input.reply,
        operation: input.reply ? "reply" : "add",
      }),
    onSuccess: () => {
      patchEvent(client, account, { id: event.id, patch: { comments: event.comments + 1 } });
      void client.invalidateQueries({ queryKey: socialKey(account, "comments", event.threadId) });
      toast.success(t("social.sent"));
    },
    onError: () => toast.error(t("social.actionFailed")),
  });
}
export function useSocialCommentActions(event: SocialEvent, comment: SocialComment) {
  const { account } = useSocialAccount(),
    client = useQueryClient(),
    { t } = useI18n();
  const key = socialKey(account, "comment-like", comment.id);
  const liking = useIsMutating({ mutationKey: key }) > 0;
  const like = useMutation({
    mutationKey: key,
    mutationFn: (liked: boolean) => likeComment(event.threadId, comment.id, liked),
    onSuccess: (_, liked) =>
      client.setQueryData<InfiniteData<SocialCommentPage>>(
        socialKey(account, "comments", event.threadId),
        (data) =>
          data
            ? {
                ...data,
                pages: data.pages.map((page) => ({
                  ...page,
                  items: page.items.map((item) =>
                    item.id === comment.id
                      ? { ...item, liked, likes: Math.max(0, item.likes + (liked ? 1 : -1)) }
                      : item,
                  ),
                })),
              }
            : data,
      ),
    onError: () => toast.error(t("social.actionFailed")),
  });
  const remove = useMutation({
    mutationFn: () =>
      changeComment({ threadId: event.threadId, commentId: comment.id, operation: "delete" }),
    onSuccess: () => {
      patchEvent(client, account, {
        id: event.id,
        patch: { comments: Math.max(0, event.comments - 1) },
      });
      void client.invalidateQueries({ queryKey: socialKey(account, "comments", event.threadId) });
    },
    onError: () => toast.error(t("social.actionFailed")),
  });
  return { like, liking, remove };
}
