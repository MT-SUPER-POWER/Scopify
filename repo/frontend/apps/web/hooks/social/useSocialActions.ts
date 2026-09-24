"use client";

import { useIsMutating, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import * as api from "@/lib/api/social";
import { patchEvent, patchFollow, socialKey } from "@/lib/social/cache";
import { useSocialAccount } from "./useSocialQueries";
import { useI18n } from "@/store/module/i18n";
import { useUserStore } from "@/store/module/user";
import type { SocialEvent, SocialPublishInput, SocialUser } from "@/types/social";
import type { UpdateUserProfilePayload } from "@/types/api/profileUpdate";

export function useSocialFollow(user: SocialUser) {
  const client = useQueryClient(),
    { account, uid } = useSocialAccount(),
    { t } = useI18n();
  const key = socialKey(account, "follow", user.id);
  const busy = useIsMutating({ mutationKey: key }) > 0;
  const mutation = useMutation({
    mutationKey: key,
    mutationFn: (follow: boolean) => api.followUser(user.id, follow),
    onSuccess: (_, follow) => {
      patchFollow(client, account, user.id, follow);
      void client.invalidateQueries({ queryKey: socialKey(account, "people") });
      void client.invalidateQueries({ queryKey: socialKey(account, "profile", user.id) });
      void client.invalidateQueries({ queryKey: socialKey(account, "profile", uid) });
    },
    onError: () => toast.error(t("social.actionFailed")),
  });
  return { ...mutation, busy };
}
export function useSocialEventActions(event: SocialEvent) {
  const client = useQueryClient(),
    { account } = useSocialAccount(),
    { t } = useI18n();
  const key = socialKey(account, "like", event.id);
  const liking = useIsMutating({ mutationKey: key }) > 0;
  const like = useMutation({
    mutationKey: key,
    mutationFn: (liked: boolean) => api.likeEvent(event.threadId, liked),
    onSuccess: (_, liked) =>
      patchEvent(client, account, {
        id: event.id,
        patch: { liked, likes: Math.max(0, event.likes + (liked ? 1 : -1)) },
      }),
    onError: () => toast.error(t("social.actionFailed")),
  });
  const remove = useMutation({
    mutationKey: socialKey(account, "delete", event.id),
    mutationFn: () => api.deleteEvent(event.id),
    onSuccess: () => {
      patchEvent(client, account, { id: event.id, deleted: true });
      void client.invalidateQueries({ queryKey: socialKey(account, "profile", event.user.id) });
      toast.success(t("social.deleted"));
    },
    onError: () => toast.error(t("social.actionFailed")),
  });
  return { like, liking, remove };
}
export function useSocialPublish(forwarded?: SocialEvent) {
  const client = useQueryClient(),
    { account, uid } = useSocialAccount(),
    { t } = useI18n();
  return useMutation({
    mutationFn: (input: SocialPublishInput) =>
      forwarded
        ? api.forwardEvent(forwarded.id, forwarded.user.id, input.text)
        : api.publishEvent(input),
    onSuccess: () => {
      if (forwarded)
        patchEvent(client, account, {
          id: forwarded.id,
          patch: { forwards: forwarded.forwards + 1 },
        });
      void client.invalidateQueries({ queryKey: socialKey(account, "events") });
      void client.invalidateQueries({ queryKey: socialKey(account, "profile", uid) });
      toast.success(t(forwarded ? "social.forwarded" : "social.published"));
    },
    onError: () => toast.error(t("social.actionFailed")),
  });
}
export function useSocialEditProfile() {
  const { account, uid } = useSocialAccount(),
    client = useQueryClient(),
    { t } = useI18n();
  return useMutation({
    mutationFn: (input: UpdateUserProfilePayload) => api.updateProfile(input),
    onSuccess: (_, input) => {
      const current = useUserStore.getState().user;
      if (current && String(current.userId) === uid)
        useUserStore.getState().setUser({ ...current, ...input });
      void client.invalidateQueries({ queryKey: ["social", account] });
      toast.success(t("profile.toast.updateSuccess"));
    },
    onError: () => toast.error(t("profile.toast.updateFailed")),
  });
}
