"use client";

import { Music2, Pause, Play } from "lucide-react";
import Link from "next/link";
import { Button } from "@scopify/ui/shadcn/components/button";
import {
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@scopify/ui/shadcn/components/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArtistInlineLinks } from "@/components/shared/ArtistInlineLinks";
import { SongVipBadge } from "@/components/shared/SongVipBadge";
import { getSizedImageUrl } from "@/lib/music/imageUrl";
import { formatDuration } from "@/lib/utils";
import { useTranslation } from "react-i18next";

import type { SearchLyricDialogProps } from "@/types/search/components";
import { SearchLyricActions } from "./SearchLyricActions";
import { SearchLyricSnippet } from "./SearchLyricSnippet";

export function SearchLyricDialog({
  song,
  item,
  highlightKeyword,
  isPlaying,
  onPlay,
}: SearchLyricDialogProps) {
  const { t } = useTranslation();
  return (
    <DialogContent className="border-surface-border flex h-[min(42rem,85dvh)] max-h-[85dvh] flex-col gap-0 overflow-hidden rounded-2xl bg-surface p-0 text-content sm:max-w-4xl md:flex-row">
      <aside className="border-surface-border flex shrink-0 flex-col gap-5 border-b bg-surface-elevated/40 p-6 md:w-72 md:border-r md:border-b-0 md:p-8">
        <div className="hidden aspect-square items-center justify-center overflow-hidden rounded-xl bg-surface-overlay shadow-xl md:flex">
          {song.al.picUrl ? (
            <img
              src={getSizedImageUrl(song.al.picUrl, 500)}
              alt={song.name}
              className="size-full object-cover"
            />
          ) : (
            <Music2 className="size-12 text-content-subtle" />
          )}
        </div>
        <div className="min-w-0 pr-6 md:pr-0">
          <DialogTitle className="text-xl leading-relaxed">{song.name}</DialogTitle>
          <DialogDescription className="sr-only">
            {t("search.lyrics.viewFull")} · {song.name}
          </DialogDescription>
          <div className="mt-2 text-sm text-content-muted">
            <ArtistInlineLinks
              artists={song.ar}
              className="text-content-muted hover:text-content"
            />
          </div>
          {song.al.name ? (
            <Link
              href={`/album?id=${song.al.id}`}
              className="mt-2 block truncate text-xs text-content-subtle hover:text-content"
              title={song.al.name}
            >
              {song.al.name}
            </Link>
          ) : null}
          <div className="mt-3 flex items-center gap-2 text-xs text-content-subtle">
            {formatDuration(song.dt)} <SongVipBadge fee={song.fee} />
          </div>
        </div>
        <Button onClick={() => onPlay(song)} className="gap-2 rounded-full">
          {isPlaying ? (
            <Pause className="size-4 fill-current" />
          ) : (
            <Play className="size-4 fill-current" />
          )}
          {t(isPlaying ? "contextMenu.pause" : "contextMenu.play")}
        </Button>
        <div className="md:mt-auto">
          <SearchLyricActions song={song} />
        </div>
      </aside>
      <ScrollArea
        className="min-h-0 min-w-0 flex-1 overflow-hidden"
        viewportClassName="overscroll-contain"
      >
        <section className="px-6 py-8 md:px-10 md:py-12" aria-label={t("search.lyrics.viewFull")}>
          <SearchLyricSnippet item={item} highlightKeyword={highlightKeyword} full />
        </section>
      </ScrollArea>
    </DialogContent>
  );
}
