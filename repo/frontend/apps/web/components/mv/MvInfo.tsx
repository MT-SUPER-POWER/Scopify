"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { FolderHeart, ThumbsUp } from "lucide-react";
import { useMVLikeMutation, useMVSubscriptionMutation } from "@/hooks/mv/useMVMutations";
import { useMVDetailInfoQuery } from "@/hooks/mv/useMVQueries";
import { useLoginStatus } from "@/lib/hooks/useLoginStatus";
import { cn, formatPlayCount } from "@/lib/utils";
import { useI18n } from "@/store/module/i18n";
import type { MvInfoProps } from "@/types/components/mv";

const ACTION_BTN =
  "flex h-9 items-center gap-2 rounded-full px-4 text-sm font-bold transition-all hover:scale-105 disabled:opacity-50";

/** MV 标题、艺人、播放量与发布时间，点赞/收藏操作和可展开的简介。 */
export function MvInfo({ detail, isSubscribed }: MvInfoProps) {
  const { t } = useI18n();
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

  const requireLogin = () => {
    if (isLoggedIn) return true;
    toast.error(t("mv.toast.loginRequired"));
    return false;
  };

  return (
    <section className="mt-5">
      <h1 className="text-2xl font-bold text-content md:text-3xl">{detail.name}</h1>
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-content-muted">
        {artists.map((artist, index) => (
          <span key={artist.id}>
            {index > 0 && <span className="mr-3 text-content-subtle">/</span>}
            <Link
              href={`/artist?id=${artist.id}`}
              scroll={false}
              className="font-bold text-content hover:underline"
            >
              {artist.name}
            </Link>
          </span>
        ))}
        {detail.playCount ? (
          <span>{t("mv.meta.plays", { count: formatPlayCount(detail.playCount) })}</span>
        ) : null}
        {detail.publishTime && <span>{t("mv.meta.published", { date: detail.publishTime })}</span>}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={likeMutation.isPending}
          aria-pressed={info?.liked ?? false}
          onClick={() => {
            if (requireLogin()) likeMutation.mutate({ mvid: detail.id, liked: !info?.liked });
          }}
          className={cn(
            ACTION_BTN,
            info?.liked
              ? "bg-brand text-brand-foreground"
              : "bg-content/8 text-content hover:bg-content/15",
          )}
        >
          <ThumbsUp className={cn("size-4", info?.liked && "fill-current")} />
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
          className={cn(
            ACTION_BTN,
            isSubscribed
              ? "bg-brand text-brand-foreground"
              : "bg-content/8 text-content hover:bg-content/15",
          )}
        >
          <FolderHeart className="size-4" />
          {t(isSubscribed ? "mv.action.subscribed" : "mv.action.subscribe")}
        </button>
      </div>

      {description && (
        <div className="mt-4 rounded-lg bg-surface-elevated/60 p-4">
          <p
            className={cn(
              "text-sm leading-6 whitespace-pre-line text-content-muted",
              !isDescExpanded && "line-clamp-3",
            )}
          >
            {description}
          </p>
          <button
            type="button"
            onClick={() => setIsDescExpanded((value) => !value)}
            className="mt-1 text-xs font-bold text-content hover:underline"
          >
            {t(isDescExpanded ? "common.action.showLess" : "common.action.showAll")}
          </button>
        </div>
      )}
    </section>
  );
}
