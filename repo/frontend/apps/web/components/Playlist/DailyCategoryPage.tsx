"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { PlaylistContent } from "@/components/Playlist/PlaylistContent";
import { PlaylistPageSkeleton } from "@/components/Playlist/PlaylistPageSkeleton";
import { DailyCategorySelector } from "@/components/Playlist/DailyCategorySelector";
import { DailyRecommendationSwitch } from "@/components/Playlist/DailyRecommendationSwitch";
import { QueryBoundary } from "@/components/shared/QueryBoundary";
import { useDailyCategorySongs } from "@/hooks/playlist/useDailyCategoryRecommendations";
import { useSmartRouter } from "@/hooks/core/useSmartRouter";
import { useUserStore } from "@/store";
import { useTranslation } from "react-i18next";
import { useI18nStore } from "@/store/module/i18n";
import { pruneSongDetail } from "@/types/song/api";
import type { DailyCategoryPageBodyProps } from "@/types/playlist/components";

export function DailyCategoryPage() {
  const accountId = useUserStore((state) => state.user?.userId);
  const { t } = useTranslation();
  return (
    <div className="relative bg-surface-raised">
      {accountId ? (
        <QueryBoundary resetKey={String(accountId)}>
          <DailyCategoryPageBody accountId={accountId} />
        </QueryBoundary>
      ) : (
        <div className="px-8 pt-16 text-content">{t("home.toast.loadFailed")}</div>
      )}
    </div>
  );
}

function DailyCategoryPageBody({ accountId }: DailyCategoryPageBodyProps) {
  const { t } = useTranslation(),
    locale = useI18nStore((state) => state.locale);
  const router = useSmartRouter();
  const dailyDate = useSearchParams().get("dailyDate");
  const dailyUrl = dailyDate
    ? `/playlist/?isDailyRecommend=true&dailyDate=${encodeURIComponent(dailyDate)}`
    : "/playlist/?isDailyRecommend=true";
  const date = new Date().toISOString().slice(0, 10);
  const query = useDailyCategorySongs(accountId, date);
  const tracks = useMemo(() => query.data?.dailySongs.map(pruneSongDetail) ?? [], [query.data]);
  if (!query.data) return <PlaylistPageSkeleton />;
  const title = locale === "en-US" ? "Style recommendations" : "风格推荐";
  return (
    <PlaylistContent
      dailyDate={null}
      isDailyRecommend={false}
      isLoading={false}
      playlistId={null}
      playSourceId={`daily-category:${accountId}:${date}:${query.data.tags.categoryId}:${query.data.tags.tagVOList.map((tag) => tag.tagId).join(",")}`}
      playlistInfo={{
        isSpecial: true,
        privacy: t("playlist.meta.madeForYou"),
        tags: query.data.tags.tagVOList.map((tag) => tag.tagName),
        title,
        cover: null,
        createTime: new Date().toLocaleDateString(),
        creator: "Scopify",
        creatorID: null,
        creatorAvatar: "",
        likes: "-",
        totalSongs: tracks.length,
      }}
      readonly
      refetchTracks={query.refetch}
      themeColor="#c42b2b"
      tracks={tracks}
      trailingActionSlot={
        <>
          <DailyRecommendationSwitch
            label={t("playlist.meta.dailyTitle")}
            onClick={() => router.push(dailyUrl)}
          />
          <DailyCategorySelector accountId={accountId} selected={query.data.tags} />
        </>
      }
    />
  );
}
