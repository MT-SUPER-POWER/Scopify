"use client";

import { Play } from "lucide-react";
import Image from "next/image";

import { cn } from "@/lib/utils";
import SPOTIFYANIME from "@/resources/eq-playing.svg";
import { useI18n } from "@/store/module/i18n";
import type { PlayerQueueItemCoverProps } from "@/types/components/player";

export function PlayerQueueItemCover({
  index,
  isActive,
  isPlaying,
  song,
}: PlayerQueueItemCoverProps) {
  const { t } = useI18n();

  return (
    <div className="flex shrink-0 items-center gap-3 pr-1">
      <span
        className={cn(
          "w-4 text-center text-[10px] tabular-nums",
          isActive ? "text-brand" : "text-content-muted",
        )}
      >
        {(index + 1).toString().padStart(2, "0")}
      </span>
      <div className="group/cover relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded">
        <Image
          src={song.al.picUrl}
          alt={song.name}
          className={cn(
            "size-full object-cover transition-opacity",
            isActive ? "opacity-40" : "group-hover/cover:opacity-40",
          )}
          fill
        />
        <div className="absolute inset-0 flex items-center justify-center">
          {isActive ? (
            isPlaying ? (
              <Image
                src={SPOTIFYANIME}
                alt={t("common.status.playing")}
                width={14}
                height={14}
                unoptimized
              />
            ) : (
              <Play className="size-4 fill-current text-brand" />
            )
          ) : (
            <Play className="size-4 fill-current text-content opacity-0 transition-opacity group-hover/cover:opacity-100" />
          )}
        </div>
      </div>
    </div>
  );
}
