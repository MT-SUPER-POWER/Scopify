"use client";

import { Bookmark, ThumbsUp } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

import { useLoginStatus } from "@/hooks/auth/useLoginStatus";
import { useMVLikeMutation, useMVSubscriptionMutation } from "@/hooks/mv/useMVMutations";
import { useMVDetailInfoQuery, useMvSubscribedQuery } from "@/hooks/mv/useMVQueries";
import { cn, formatPlayCount } from "@/lib/utils";

export const MV_ACTION_BTN =
  "flex h-9 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-medium transition-colors disabled:opacity-50";
export const MV_IDLE_BTN = "bg-content/10 text-content hover:bg-content/20";

/**
 * Like and save buttons of an MV, which are NetEase's account features (`mv.interact`); the
 * page renders this only where the platform declares them.
 */
export function MvInteractions({ mvid }: { mvid: string }) {
  const { t } = useTranslation();
  const isLoggedIn = useLoginStatus();
  const info = useMVDetailInfoQuery(mvid).data;
  const isSubscribed = useMvSubscribedQuery(mvid).data ?? false;
  const likeMutation = useMVLikeMutation();
  const subscribeMutation = useMVSubscriptionMutation();
  const isLiked = info?.liked ?? false;

  const requireLogin = () => {
    if (isLoggedIn) return true;
    toast.error(t("mv.toast.loginRequired"));
    return false;
  };

  return (
    <>
      <button
        type="button"
        disabled={likeMutation.isPending}
        aria-pressed={isLiked}
        onClick={() => {
          if (requireLogin()) likeMutation.mutate({ mvid, liked: !isLiked });
        }}
        className={cn(MV_ACTION_BTN, isLiked ? "bg-brand/15 text-brand" : MV_IDLE_BTN)}
      >
        <ThumbsUp className={cn("size-4", isLiked && "fill-current")} />
        {info?.likedCount ? formatPlayCount(info.likedCount) : t("mv.action.like")}
      </button>
      <button
        type="button"
        disabled={subscribeMutation.isPending}
        aria-pressed={isSubscribed}
        onClick={() => {
          if (requireLogin()) subscribeMutation.mutate({ mvid, subscribe: !isSubscribed });
        }}
        className={cn(MV_ACTION_BTN, isSubscribed ? "bg-brand/15 text-brand" : MV_IDLE_BTN)}
      >
        <Bookmark className={cn("size-4", isSubscribed && "fill-current")} />
        {t(isSubscribed ? "mv.action.subscribed" : "mv.action.subscribe")}
      </button>
    </>
  );
}
