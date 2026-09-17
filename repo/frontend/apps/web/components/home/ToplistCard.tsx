"use client";

import { ChevronLeft, ChevronRight, Loader2, Play } from "lucide-react";
import Image from "next/image";
import { memo, useCallback, useEffect, useMemo, useState } from "react";

import { useToplistTracksQuery } from "@/hooks/home/useHomeQueries";
import { useSmartRouter } from "@/lib/hooks/useSmartRouter";
import { cn } from "@/lib/utils";
import type { SongDetail } from "@/types/api/music";
import type { ToplistDetailItem } from "@/types/api/toplist";

interface ToplistCardProps {
  isLoading?: boolean;
  onPlay: (id: number | string, event: React.MouseEvent) => void;
  toplist: ToplistDetailItem;
}

interface CarouselItem {
  artist: string;
  coverUrl: string;
  id: number;
  name: string;
  rank: number;
  song?: SongDetail;
}

export const ToplistCard = memo(function ToplistCard({
  isLoading = false,
  onPlay,
  toplist,
}: ToplistCardProps) {
  const smartRouter = useSmartRouter();

  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Fetch top 3 tracks with album covers
  const { data: topTracks } = useToplistTracksQuery(toplist.id);

  const chartBadgeCover = toplist.coverImgUrl ? `${toplist.coverImgUrl}?param=120y120` : "";

  // Prepare carousel slides (fallback to toplist.tracks while loading)
  const carouselItems = useMemo<CarouselItem[]>(() => {
    if (topTracks && topTracks.length > 0) {
      return topTracks.slice(0, 3).map((song, idx) => ({
        artist: song.ar.map((a) => a.name).join(" / "),
        coverUrl: song.al?.picUrl ? `${song.al.picUrl}?param=600y600` : toplist.coverImgUrl,
        id: song.id,
        name: song.name,
        rank: idx + 1,
        song,
      }));
    }

    const fallbackTracks = toplist.tracks?.slice(0, 3) ?? [];
    if (fallbackTracks.length > 0) {
      return fallbackTracks.map((item, idx) => ({
        artist: item.second,
        coverUrl: toplist.coverImgUrl ? `${toplist.coverImgUrl}?param=600y600` : "",
        id: idx + 1,
        name: item.first,
        rank: idx + 1,
      }));
    }

    return [
      {
        artist: toplist.updateFrequency || "官方榜单",
        coverUrl: toplist.coverImgUrl ? `${toplist.coverImgUrl}?param=600y600` : "",
        id: toplist.id,
        name: toplist.name,
        rank: 1,
      },
    ];
  }, [topTracks, toplist]);

  const itemsCount = carouselItems.length;

  // Auto-rotation timer (pause when hovered)
  useEffect(() => {
    if (isHovered || itemsCount <= 1) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % itemsCount);
    }, 4500);

    return () => clearInterval(interval);
  }, [isHovered, itemsCount]);

  const handlePrev = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setActiveIndex((prev) => (prev - 1 + itemsCount) % itemsCount);
    },
    [itemsCount],
  );

  const handleNext = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setActiveIndex((prev) => (prev + 1) % itemsCount);
    },
    [itemsCount],
  );

  const handleCardClick = () => {
    smartRouter.push(`/playlist/?id=${toplist.id}&isRecommend=true`);
  };

  const currentItem = carouselItems[activeIndex] ?? carouselItems[0];

  return (
    <div
      onClick={handleCardClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "group relative h-95 w-full cursor-pointer overflow-hidden rounded-2xl select-none sm:h-100",
        "border border-content/10 bg-surface-elevated shadow-lg transition-all duration-500",
        "hover:shadow-2xl hover:shadow-black/30",
      )}
    >
      {/* Background Image Carousel (GPU Crossfade) */}
      {carouselItems.map((item, idx) => (
        <div
          key={item.id || idx}
          className={cn(
            "absolute inset-0 transition-opacity duration-700 ease-in-out",
            idx === activeIndex ? "z-0 opacity-100" : "pointer-events-none z-0 opacity-0",
          )}
        >
          {item.coverUrl ? (
            <Image
              src={item.coverUrl}
              alt={item.name}
              fill
              priority={idx === 0}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              className="size-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            />
          ) : (
            <div className="size-full bg-surface-sunken" />
          )}
        </div>
      ))}

      {/* Dark Gradient Overlays for High Legibility */}
      <div className="pointer-events-none absolute inset-0 z-1 bg-overlay/20" />
      <div className="pointer-events-none absolute inset-x-0 top-0 z-2 h-32 bg-linear-to-b from-overlay/85 via-overlay/40 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-2 h-48 bg-linear-to-t from-overlay/90 via-overlay/60 to-transparent" />

      {/* Top Left: Chart Badge Icon & Title */}
      <div className="absolute top-4 right-18 left-4 z-10 flex items-center gap-3">
        <div className="relative size-12 shrink-0 overflow-hidden rounded-lg border border-overlay-foreground/20 bg-overlay/40 shadow-md">
          {chartBadgeCover ? (
            <Image
              src={chartBadgeCover}
              alt={toplist.name}
              width={48}
              height={48}
              className="size-full object-cover"
            />
          ) : (
            <div className="size-full bg-surface-elevated" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-bold text-overlay-foreground drop-shadow-md sm:text-lg">
            {toplist.name}
          </h3>
          <span className="mt-0.5 inline-block truncate text-xs font-medium text-overlay-foreground/80 drop-shadow-sm">
            {toplist.updateFrequency ? `榜单 · ${toplist.updateFrequency}` : "官方榜单"}
          </span>
        </div>
      </div>

      {/* Top Right: Progress Indicators */}
      {itemsCount > 1 && (
        <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5 rounded-full border border-overlay-foreground/15 bg-overlay/40 px-2 py-1 backdrop-blur-md">
          {carouselItems.map((_, idx) => (
            <span
              key={idx}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                idx === activeIndex
                  ? "w-4 bg-overlay-foreground"
                  : "w-1.5 bg-overlay-foreground/40",
              )}
            />
          ))}
        </div>
      )}

      {/* Hover Chevrons: Left & Right (< >) */}
      {itemsCount > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous track"
            onClick={handlePrev}
            className={cn(
              "absolute top-1/2 left-3 z-20 flex size-8 -translate-y-1/2 items-center justify-center rounded-full",
              "border border-overlay-foreground/20 bg-overlay/50 text-overlay-foreground opacity-0 shadow-lg backdrop-blur-md transition-all duration-300",
              "group-hover:opacity-100 hover:scale-110 hover:bg-overlay/80 active:scale-95 sm:size-9",
            )}
          >
            <ChevronLeft className="size-4.5" />
          </button>

          <button
            type="button"
            aria-label="Next track"
            onClick={handleNext}
            className={cn(
              "absolute top-1/2 right-3 z-20 flex size-8 -translate-y-1/2 items-center justify-center rounded-full",
              "border border-overlay-foreground/20 bg-overlay/50 text-overlay-foreground opacity-0 shadow-lg backdrop-blur-md transition-all duration-300",
              "group-hover:opacity-100 hover:scale-110 hover:bg-overlay/80 active:scale-95 sm:size-9",
            )}
          >
            <ChevronRight className="size-4.5" />
          </button>
        </>
      )}

      {/* Bottom Area: Track Metadata & Actions */}
      <div className="absolute inset-x-4 bottom-4 z-10 flex items-end justify-between gap-3">
        <div className="min-w-0 flex-1">
          <span className="mb-1 inline-block rounded bg-brand px-1.5 py-0.5 text-[10px] font-extrabold tracking-wider text-brand-foreground uppercase shadow-xs">
            TOP {currentItem.rank}
          </span>
          <h4 className="truncate text-base font-bold text-overlay-foreground drop-shadow-sm sm:text-lg">
            {currentItem.name}
          </h4>
          <p className="mt-0.5 truncate text-xs text-overlay-foreground/80 drop-shadow-xs">
            {currentItem.artist}
          </p>
        </div>

        {/* Big White Circular Play Button (Plays Whole Chart) */}
        <button
          type="button"
          aria-label="Play Toplist"
          onClick={(e) => onPlay(toplist.id, e)}
          disabled={isLoading}
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-full bg-overlay-foreground text-overlay shadow-2xl transition-all duration-200 sm:size-12",
            "shadow-floating hover:scale-110 hover:bg-overlay-foreground/95 active:scale-95",
            isLoading && "opacity-80",
          )}
        >
          {isLoading ? (
            <Loader2 className="size-5 animate-spin" />
          ) : (
            <Play className="ml-0.5 size-5 fill-current" />
          )}
        </button>
      </div>
    </div>
  );
});
