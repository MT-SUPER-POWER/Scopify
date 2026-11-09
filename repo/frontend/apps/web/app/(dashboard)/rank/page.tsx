"use client";

import type { MusicListeningRankRange } from "@scopify/music-domain/library";
import { BarChart3 } from "lucide-react";
import { useMemo, useState } from "react";
import { LibraryErrorPage } from "@/components/library/LibraryErrorPage";
import { LibraryStatePage } from "@/components/library/LibraryStatePage";
import { PlaylistContent } from "@/components/Playlist/PlaylistContent";
import { QuietState } from "@/components/shared/QuietState";
import { useActiveAccount } from "@/hooks/auth/useProviderAccounts";
import { useListeningRankQuery } from "@/hooks/library/useProviderLibraryLists";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

import type { PlaylistInfo } from "@/types/playlist/model";

const RANGES: readonly MusicListeningRankRange[] = ["day", "week", "month", "year"];

/** The account's most played songs by period, as the platform ranks them. */
export default function ListeningRankPage() {
  const { t } = useTranslation();
  const { isLoggedIn } = useActiveAccount();
  const [range, setRange] = useState<MusicListeningRankRange>("week");
  const query = useListeningRankQuery(range);
  const tracks = useMemo(() => (query.data ?? []).map((entry) => entry.track), [query.data]);
  const playlistInfo = useMemo<PlaylistInfo | null>(() => {
    if (query.isLoading) return null;
    return {
      cover: tracks[0]?.album?.coverUrl ?? null,
      createTime: "",
      creator: "",
      creatorAvatar: "",
      creatorID: null,
      isSpecial: true,
      likes: "",
      privacy: t("library.meta.rank"),
      tags: [],
      title: t("library.title.rank"),
      totalSongs: tracks.length,
    };
  }, [query.isLoading, t, tracks]);

  if (!isLoggedIn) {
    return (
      <LibraryStatePage>
        <QuietState icon={BarChart3} title={t("library.loggedOut.rank")} />
      </LibraryStatePage>
    );
  }
  if (query.isError) {
    return (
      <LibraryErrorPage isRetrying={query.isRefetching} onRetry={() => void query.refetch()} />
    );
  }

  return (
    <PlaylistContent
      actionSlot={
        <div role="tablist" className="flex items-center gap-1 rounded-full bg-content/10 p-1">
          {RANGES.map((item) => (
            <button
              key={item}
              type="button"
              role="tab"
              aria-selected={item === range}
              onClick={() => setRange(item)}
              className={cn(
                "cursor-pointer rounded-full px-3 py-1 text-sm font-medium transition-colors",
                item === range
                  ? "bg-brand text-brand-foreground"
                  : "text-content-muted hover:text-content",
              )}
            >
              {t(`library.rank.range.${item}`)}
            </button>
          ))}
        </div>
      }
      contentSlot={
        tracks.length === 0
          ? () => (
              <QuietState
                icon={BarChart3}
                title={t("library.empty.rank.title")}
                description={t("library.empty.rank.description")}
              />
            )
          : undefined
      }
      dailyDate={null}
      isDailyRecommend={false}
      isLoading={query.isLoading}
      playlistId={null}
      playlistInfo={playlistInfo}
      playSourceId={`library:rank:${range}`}
      refetchTracks={query.refetch}
      themeColor="var(--scopify-page-accent-recent)"
      tracks={tracks}
    />
  );
}
