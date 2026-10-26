"use client";

import {
  ChevronDown,
  ChevronUp,
  Disc3,
  LoaderCircle,
  Music2,
  Pause,
  Play,
  Quote,
} from "lucide-react";
import Link from "next/link";
import { memo, useCallback, useMemo, useState } from "react";

import { ArtistInlineLinks } from "@/components/shared/ArtistInlineLinks";
import { SongContextMenu } from "@/components/shared/SongContextMenu";
import { SongMvBadge } from "@/components/shared/SongMvBadge";
import { SongVipBadge } from "@/components/shared/SongVipBadge";
import { useInfiniteScrollTrigger } from "@/hooks/search/useInfiniteScrollTrigger";
import { getSizedImageUrl } from "@/lib/music/imageUrl";
import { cn, formatDuration } from "@/lib/utils";
import { usePlayerStore } from "@/store";
import { useI18n } from "@/store/module/i18n";
import type { SongDetail } from "@/types/api/music";
import type { LyricsViewProps } from "@/types/components/search";
import type { LyricSearchItem, Song } from "@/types/search";
import { SearchCategoryHeader } from "./SearchCategoryHeader";

function songToSongDetail(song: Song): SongDetail {
  const picUrl = song.album?.picUrl || song.artists?.[0]?.picUrl || "";
  return {
    al: { id: song.album?.id ?? 0, name: song.album?.name ?? "", picUrl },
    alia: song.alias,
    ar: (song.artists || []).map((a) => ({ id: a.id, name: a.name })),
    dt: song.duration,
    fee: song.fee ?? 0,
    id: song.id,
    name: song.name,
    publishTime: song.album?.publishTime || 0,
    ...(song.mvid ? { mv: song.mvid } : {}),
  };
}

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function HighlightedText({ highlight, text }: { highlight?: string; text: string }) {
  if (!highlight || !highlight.trim()) {
    return <>{text}</>;
  }

  const query = highlight.trim();
  const escaped = escapeRegExp(query);
  const pattern = new RegExp(`(${escaped})`, "gi");
  const checkPattern = new RegExp(`^${escaped}$`, "i");
  const parts = text.split(pattern);

  return (
    <>
      {parts.map((part, index) =>
        checkPattern.test(part) ? (
          <mark key={index} className="rounded bg-brand/15 px-0.5 font-medium text-brand">
            {part}
          </mark>
        ) : (
          part
        ),
      )}
    </>
  );
}

interface LyricCardProps {
  currentSongId?: number;
  highlightKeyword?: string;
  isPlaying: boolean;
  item: LyricSearchItem;
  onPlay: (song: SongDetail) => void;
}

const LyricCard = memo(function LyricCard({
  currentSongId,
  highlightKeyword,
  isPlaying,
  item,
  onPlay,
}: LyricCardProps) {
  const { t } = useI18n();
  const [isExpanded, setIsExpanded] = useState(false);
  const song = item.song;
  const songDetail = useMemo(() => songToSongDetail(song), [song]);
  const isCurrent = currentSongId === song.id;
  const activeIsPlaying = isCurrent && isPlaying;

  const handlePlayClick = useCallback(() => {
    onPlay(songDetail);
  }, [onPlay, songDetail]);

  const highlight = item.highlightText || highlightKeyword;
  const matchedLines = useMemo(
    () => (item.matchedLyric ? item.matchedLyric.split("\n").filter(Boolean) : []),
    [item.matchedLyric],
  );
  const fullLines = useMemo(
    () => (item.lyric ? item.lyric.split("\n").filter(Boolean) : []),
    [item.lyric],
  );

  const coverUrl = song.album?.picUrl || song.artists?.[0]?.picUrl || "";

  return (
    <SongContextMenu
      isActive={isCurrent}
      isPlaying={activeIsPlaying}
      onPlay={handlePlayClick}
      song={songDetail}
    >
      <div
        onDoubleClick={handlePlayClick}
        className={cn(
          "group border-surface-border relative flex flex-col rounded-xl border bg-surface-elevated/40 p-4 transition-all duration-200 select-none",
          "hover:border-surface-border-strong hover:bg-surface-elevated/80 hover:shadow-sm",
          isCurrent && "border-brand/30 bg-brand/5 ring-1 ring-brand/20",
        )}
      >
        {/* Top: Track metadata row */}
        <div className="flex items-center gap-3">
          {/* Cover & play overlay */}
          <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-surface-overlay">
            {coverUrl ? (
              <img
                src={getSizedImageUrl(coverUrl, 96)}
                alt={song.name}
                loading="lazy"
                className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="flex size-full items-center justify-center text-content-subtle">
                <Music2 className="size-5" />
              </div>
            )}
            <button
              type="button"
              onClick={handlePlayClick}
              aria-label={activeIsPlaying ? t("contextMenu.pause") : t("contextMenu.play")}
              className={cn(
                "absolute inset-0 flex items-center justify-center bg-black/45 text-white transition-opacity",
                activeIsPlaying
                  ? "opacity-100"
                  : "opacity-0 group-hover:opacity-100 focus-visible:opacity-100",
              )}
            >
              {activeIsPlaying ? (
                <Pause className="size-5 fill-white" />
              ) : (
                <Play className="ml-0.5 size-5 fill-white" />
              )}
            </button>
          </div>

          {/* Title & Artist */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span
                title={song.name}
                className={cn(
                  "truncate text-sm font-medium",
                  isCurrent ? "text-brand" : "text-content",
                )}
              >
                {song.name}
              </span>
              {song.alias?.length ? (
                <span className="truncate text-xs text-content-subtle">
                  ({song.alias.join(" / ")})
                </span>
              ) : null}
              <SongVipBadge fee={song.fee} />
              <SongMvBadge mvId={song.mvid} />
            </div>

            <div className="mt-0.5 flex items-center gap-1.5 text-xs text-content-muted">
              <ArtistInlineLinks
                artists={(song.artists || []).map((a) => ({ id: a.id, name: a.name }))}
                className="truncate text-xs text-content-muted hover:text-content"
              />
              {song.album?.name ? (
                <>
                  <span className="text-content-subtle/50">·</span>
                  <Link
                    href={`/album?id=${song.album.id}`}
                    onClick={(e) => e.stopPropagation()}
                    title={song.album.name}
                    className="flex max-w-50 items-center gap-1 truncate hover:text-content"
                  >
                    <Disc3 className="size-3 shrink-0 text-content-subtle" />
                    <span className="truncate">{song.album.name}</span>
                  </Link>
                </>
              ) : null}
            </div>
          </div>

          {/* Duration */}
          <div className="shrink-0 text-xs text-content-subtle tabular-nums">
            {formatDuration(song.duration)}
          </div>
        </div>

        {/* Bottom: Matched lyrics snippet */}
        <div className="border-surface-border bg-surface-subtle/40 mt-3.5 rounded-lg border p-3 text-xs">
          <div className="mb-1.5 flex items-center justify-between text-content-subtle">
            <span className="flex items-center gap-1 text-[11px] font-medium tracking-wide">
              <Quote className="size-3 text-brand/70" />
              {t("search.lyrics.matchedSnippet")}
            </span>
            {fullLines.length > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(!isExpanded);
                }}
                className="flex items-center gap-0.5 text-[11px] text-content-subtle transition-colors hover:text-brand"
              >
                {isExpanded ? (
                  <>
                    <span>{t("search.lyrics.collapseFull")}</span>
                    <ChevronUp className="size-3" />
                  </>
                ) : (
                  <>
                    <span>{t("search.lyrics.viewFull")}</span>
                    <ChevronDown className="size-3" />
                  </>
                )}
              </button>
            )}
          </div>

          <div
            className={cn(
              "space-y-1 font-sans text-content-muted transition-all",
              isExpanded && "max-h-60 overflow-y-auto pr-2",
            )}
          >
            {(isExpanded ? fullLines : matchedLines).map((line, index) => (
              <p key={index} className="leading-relaxed">
                <HighlightedText text={line} highlight={highlight} />
              </p>
            ))}
          </div>
        </div>
      </div>
    </SongContextMenu>
  );
});

export function LyricsView({
  hasNextPage,
  isFetchingNextPage,
  items,
  keyword,
  onLoadMore,
}: LyricsViewProps) {
  const { t } = useI18n();
  const currentSongId = usePlayerStore((s) => s.currentSongDetail?.id);
  const isPlaying = usePlayerStore((s) => s.isPlaying);

  const loadMoreRef = useInfiniteScrollTrigger({
    enabled: hasNextPage && !isFetchingNextPage,
    onIntersect: onLoadMore,
  });

  const allSongDetails = useMemo(() => items.map((item) => songToSongDetail(item.song)), [items]);

  const handlePlaySong = useCallback(
    (targetSong: SongDetail) => {
      const player = usePlayerStore.getState();
      if (player.currentSongDetail?.id === targetSong.id) {
        void player.togglePlaying();
      } else {
        void player.playFromSong(targetSong, allSongDetails, "search-lyrics");
      }
    },
    [allSongDetails],
  );

  return (
    <div className="pb-10">
      <SearchCategoryHeader category="Lyrics" />

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-content-muted">
          <Quote className="stroke-1.5 mb-3 size-10 text-content-subtle" />
          <p className="text-sm">{t("search.section.noLyricResults")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
          {items.map((item) => (
            <LyricCard
              key={`${item.song.id}-${item.highlightText || ""}`}
              item={item}
              keyword={keyword}
              currentSongId={currentSongId}
              isPlaying={isPlaying}
              onPlay={handlePlaySong}
            />
          ))}
        </div>
      )}

      <div ref={loadMoreRef} aria-hidden className="h-px" />
      {isFetchingNextPage ? (
        <div className="flex justify-center py-6 text-content-muted" aria-live="polite">
          <LoaderCircle className="size-5 animate-spin" />
        </div>
      ) : null}
    </div>
  );
}
