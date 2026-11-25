"use client";

import Image from "next/image";
import { animate, motion, useMotionValue } from "framer-motion";
import { Check, Disc3, Music2, Play } from "lucide-react";
import { memo, useEffect, useState } from "react";
import { getSizedImageUrl } from "@/lib/music/imageUrl";
import { resolveCoverUrl } from "@/lib/music/resolveCoverUrl";
import { formatTrackArtists } from "@/lib/player/trackDisplay";
import { cn, formatDuration } from "@/lib/utils";
import type { ScratchpadCardProps } from "@/types/scratchpad/components";

const SNAP = { type: "spring", stiffness: 520, damping: 42, mass: 0.7 } as const;

/**
 * 速记簿工作区画布中的单张曲目卡片。
 * 位置通过 MotionValue 驱动以保证拖拽与让位动画 60fps 流畅；视觉完全遵循 Scopify 的 surface/border/brand 体系。
 */
export const ScratchpadCard = memo(function ScratchpadCard({
  entry,
  slotX,
  slotY,
  isMoving,
  isSelected,
  isFresh,
  movingCount = 0,
  width,
  height,
  variant = "note",
  currentLabel = "",
  playLabel,
  register,
  onPointerDown,
  onPlay,
}: ScratchpadCardProps) {
  const x = useMotionValue(slotX);
  const y = useMotionValue(slotY);
  const [coverFailed, setCoverFailed] = useState(false);

  const rawCover = resolveCoverUrl(entry.track.album?.coverUrl ?? undefined);
  const coverUrl = rawCover ? getSizedImageUrl(rawCover, Math.max(240, Math.round(width * 2))) : "";
  const artists = formatTrackArtists(entry.track);
  const subtitle = entry.meta ?? artists;
  const isCompact = width < 160;

  useEffect(() => {
    register(entry.key, { x, y });
    return () => register(entry.key, null);
  }, [entry.key, register, x, y]);

  useEffect(() => {
    if (isMoving) return;
    const toX = animate(x, slotX, SNAP);
    const toY = animate(y, slotY, SNAP);
    return () => {
      toX.stop();
      toY.stop();
    };
  }, [isMoving, slotX, slotY, x, y]);

  return (
    <motion.div
      role="option"
      aria-selected={isSelected}
      data-scratchpad-key={entry.key}
      style={{ x, y, width, height }}
      onPointerDown={(event) => onPointerDown(entry, event)}
      onDoubleClick={() => onPlay(entry)}
      title={`${entry.track.title} · ${artists}`}
      className={cn(
        "group absolute top-0 left-0 flex cursor-pointer flex-col rounded-xl border p-2.5 select-none",
        "bg-surface-raised transition-[border-color,box-shadow,background-color,opacity] duration-150",
        isMoving
          ? "z-30 scale-[1.03] border-brand/70 shadow-2xl"
          : isSelected
            ? "z-10 border-brand/70 bg-brand/6 shadow-md ring-2 ring-brand"
            : isFresh
              ? "border-brand/50 bg-brand/5 ring-1 ring-brand/35"
              : entry.isCurrent
                ? "border-brand/50 bg-brand/5 shadow-sm"
                : "border-border/70 shadow-xs hover:border-border hover:shadow-md",
        entry.isDimmed && !isSelected && !isMoving && "opacity-60 hover:opacity-100",
      )}
    >
      <div className="relative aspect-square w-full shrink-0 overflow-hidden rounded-lg bg-surface-sunken">
        {coverUrl && !coverFailed ? (
          <Image
            fill
            sizes="240px"
            src={coverUrl}
            alt={entry.track.album?.title ?? entry.track.title}
            draggable={false}
            onError={() => setCoverFailed(true)}
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-content-muted/60">
            <Music2 className="size-8" />
          </div>
        )}

        <div
          className={cn(
            "pointer-events-none absolute inset-0 bg-linear-to-t from-black/45 via-transparent to-transparent transition-opacity",
            entry.isCurrent ? "opacity-100" : "opacity-0 group-hover:opacity-100",
          )}
        />

        {entry.isCurrent && (
          <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-brand px-2 py-0.5 text-[10px] font-semibold text-white shadow-sm">
            <Disc3 className="size-3 animate-spin" />
            {currentLabel && <span className="max-w-20 truncate">{currentLabel}</span>}
          </span>
        )}

        {!entry.isCurrent && variant === "queue" && entry.position !== undefined && (
          <span className="absolute bottom-2 left-2 rounded-md bg-black/55 px-1.5 py-0.5 text-[10px] font-semibold text-white/95 tabular-nums backdrop-blur-xs">
            #{entry.position}
          </span>
        )}

        {entry.badge && (
          <span className="absolute top-2 right-2 max-w-[75%] truncate rounded-md bg-black/55 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur-xs">
            {entry.badge}
          </span>
        )}

        <span
          aria-hidden
          className={cn(
            "absolute top-2 left-2 flex size-5 items-center justify-center rounded-full transition-all",
            isSelected
              ? "scale-100 bg-brand text-white shadow-sm"
              : "scale-90 border border-white/60 bg-black/35 text-transparent opacity-0 backdrop-blur-xs group-hover:opacity-80",
          )}
        >
          <Check className="size-3 stroke-[2.5]" />
        </span>

        {movingCount > 1 && (
          <span
            aria-hidden
            className="absolute top-2 right-2 rounded-full bg-brand px-2 py-0.5 text-xs font-bold text-white tabular-nums shadow-md"
          >
            {movingCount}
          </span>
        )}

        <button
          type="button"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => {
            event.stopPropagation();
            onPlay(entry);
          }}
          title={playLabel}
          aria-label={playLabel}
          className={cn(
            "absolute right-2 bottom-2 flex size-8 items-center justify-center rounded-full bg-brand text-white shadow-lg transition-all",
            "hover:scale-105 active:scale-95",
            "translate-y-1 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 focus-visible:translate-y-0 focus-visible:opacity-100",
          )}
        >
          <Play className="size-3.5 translate-x-0.5 fill-current" />
        </button>
      </div>

      <div
        className={cn("mt-2 flex min-h-0 flex-1 flex-col justify-between", isCompact && "mt-1.5")}
      >
        <div className="min-w-0">
          <p
            className={cn(
              "truncate leading-snug font-semibold",
              isCompact ? "text-xs" : "text-[13px]",
              entry.isCurrent ? "text-brand" : "text-content",
            )}
          >
            {entry.track.title}
          </p>
          <p className="mt-0.5 truncate text-xs text-content-muted">{subtitle}</p>
        </div>
        {variant === "queue" && entry.track.durationMs > 0 && (
          <p className="mt-1 text-[11px] text-content-muted/75 tabular-nums">
            {formatDuration(entry.track.durationMs)}
          </p>
        )}
      </div>
    </motion.div>
  );
});
