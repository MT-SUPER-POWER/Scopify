"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Bookmark, Share2, ThumbsUp } from "lucide-react";
import { MvChannel } from "@/components/mv/MvChannel";
import { useMVLikeMutation, useMVSubscriptionMutation } from "@/hooks/mv/useMVMutations";
import { useMVDetailInfoQuery } from "@/hooks/mv/useMVQueries";
import { useLoginStatus } from "@/hooks/auth/useLoginStatus";
import { cn, formatPlayCount } from "@/lib/utils";
import { useI18n } from "@/store/module/i18n";
import type { MvInfoProps } from "@/types/mv/components";

const ACTION_BTN =
  "flex h-9 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-medium transition-colors disabled:opacity-50";
const IDLE_BTN = "bg-content/10 text-content hover:bg-content/20";

/**
 * 播放器下方的信息区（参考 YouTube 观看页）：标题；艺人行与点赞/收藏/复制链接；
 * 播放量、发布时间与简介合在一个可展开的卡片里。
 */
export function MvInfo({ detail, isSubscribed }: MvInfoProps) {
  const { t, locale } = useI18n();
  const isLoggedIn = useLoginStatus();
  const info = useMVDetailInfoQuery(detail.id).data;
  const likeMutation = useMVLikeMutation();
  const subscribeMutation = useMVSubscriptionMutation();
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const description = detail.desc || detail.briefDesc;
  const artists = detail.artists?.length
    ? detail.artists
    : detail.artistId
      ? [{ id: detail.artistId, name: detail.artistName ?? "" }]
      : [];
  const isLiked = info?.liked ?? false;
  const publishedDate = detail.publishTime ? new Date(detail.publishTime) : null;
  const publishedLabel =
    publishedDate && !Number.isNaN(publishedDate.getTime())
      ? publishedDate.toLocaleDateString(locale, { dateStyle: "long" })
      : (detail.publishTime ?? "");

  const requireLogin = () => {
    if (isLoggedIn) return true;
    toast.error(t("mv.toast.loginRequired"));
    return false;
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/mv?id=${detail.id}`);
      toast.success(t("mv.toast.linkCopied"));
    } catch {
      toast.error(t("common.message.requestFailed", { message: "" }));
    }
  };

  return (
    <section className="mt-4">
      <h1 className="text-xl leading-snug font-bold text-content md:text-2xl">{detail.name}</h1>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-x-6 gap-y-3">
          {artists.map((artist) => (
            <MvChannel key={artist.id} artist={artist} />
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={likeMutation.isPending}
            aria-pressed={isLiked}
            onClick={() => {
              if (requireLogin()) likeMutation.mutate({ mvid: detail.id, liked: !isLiked });
            }}
            className={cn(ACTION_BTN, isLiked ? "bg-brand/15 text-brand" : IDLE_BTN)}
          >
            <ThumbsUp className={cn("size-4", isLiked && "fill-current")} />
            {info?.likedCount ? formatPlayCount(info.likedCount) : t("mv.action.like")}
          </button>
          <button
            type="button"
            disabled={subscribeMutation.isPending}
            aria-pressed={isSubscribed}
            onClick={() => {
              if (requireLogin())
                subscribeMutation.mutate({ mvid: detail.id, subscribe: !isSubscribed });
            }}
            className={cn(ACTION_BTN, isSubscribed ? "bg-brand/15 text-brand" : IDLE_BTN)}
          >
            <Bookmark className={cn("size-4", isSubscribed && "fill-current")} />
            {t(isSubscribed ? "mv.action.subscribed" : "mv.action.subscribe")}
          </button>
          <button
            type="button"
            onClick={() => void copyLink()}
            className={cn(ACTION_BTN, IDLE_BTN)}
          >
            <Share2 className="size-4" />
            {t("mv.action.share")}
          </button>
        </div>
      </div>

      <div className="mt-4 rounded-xl bg-content/10 p-3 text-sm">
        <p className="font-semibold text-content">
          {[
            detail.playCount
              ? t("mv.meta.views", { count: formatPlayCount(detail.playCount) })
              : "",
            publishedLabel,
          ]
            .filter(Boolean)
            .join("  ")}
        </p>
        {description && (
          <>
            <p
              className={cn(
                "mt-1 leading-6 whitespace-pre-line text-content/90",
                !isDescExpanded && "line-clamp-2",
              )}
            >
              {description}
            </p>
            <button
              type="button"
              onClick={() => setIsDescExpanded((value) => !value)}
              className="mt-1 font-semibold text-content hover:underline"
            >
              {t(isDescExpanded ? "common.action.showLess" : "common.action.showAll")}
            </button>
          </>
        )}
      </div>
    </section>
  );
}
