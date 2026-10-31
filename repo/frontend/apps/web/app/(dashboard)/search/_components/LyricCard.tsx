"use client";

import { Music2, Pause, Play } from "lucide-react";
import { memo, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardTitle,
} from "@scopify/ui/shadcn/components/card";
import { Dialog, DialogTrigger } from "@scopify/ui/shadcn/components/dialog";
import { SongContextMenu } from "@/components/shared/SongContextMenu";
import { getSizedImageUrl } from "@/lib/music/imageUrl";
import { songToSongDetail } from "@/lib/search/lyricSearch";
import { cn, formatDuration } from "@/lib/utils";
import { useTranslation } from "react-i18next";

import type { LyricCardProps } from "@/types/search/components";
import { SearchLyricDialog } from "./SearchLyricDialog";
import { SearchLyricSnippet } from "./SearchLyricSnippet";

export const LyricCard = memo(function LyricCard({
  currentSongId,
  highlightKeyword,
  isPlaying,
  item,
  onPlay,
}: LyricCardProps) {
  const { t } = useTranslation();
  const song = useMemo(() => songToSongDetail(item.song), [item.song]);
  const isCurrent = currentSongId === song.id;
  const activeIsPlaying = isCurrent && isPlaying;

  return (
    <Dialog>
      <SongContextMenu
        song={song}
        isActive={isCurrent}
        isPlaying={activeIsPlaying}
        onPlay={() => onPlay(song)}
      >
        <Card className="group relative min-w-0 gap-0 overflow-hidden rounded-xl border-border/60 bg-card py-0 shadow-none transition-colors hover:border-border hover:bg-accent/30">
          <DialogTrigger asChild>
            <button
              type="button"
              aria-label={`${song.name} · ${t("search.lyrics.viewFull")}`}
              className="block min-w-0 cursor-pointer rounded-lg text-left outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-card"
            >
              <CardContent className="flex min-h-44 items-center p-6">
                <SearchLyricSnippet item={item} highlightKeyword={highlightKeyword} />
              </CardContent>
              <CardFooter className="gap-3 border-t border-border/40 px-5 py-4 pr-16">
                <span className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted">
                  {song.al.picUrl ? (
                    <img
                      src={getSizedImageUrl(song.al.picUrl, 64)}
                      alt=""
                      loading="lazy"
                      className="size-full object-cover"
                    />
                  ) : (
                    <Music2 className="size-4 text-muted-foreground" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <CardTitle
                    title={song.name}
                    className={cn("truncate text-sm leading-5", isCurrent && "text-brand")}
                  >
                    {song.name}
                  </CardTitle>
                  <CardDescription className="mt-1 truncate text-xs leading-4">
                    {song.ar.map((artist) => artist.name).join(" / ")} · {formatDuration(song.dt)}
                  </CardDescription>
                </span>
              </CardFooter>
            </button>
          </DialogTrigger>
          <button
            type="button"
            onClick={() => onPlay(song)}
            aria-label={`${t(activeIsPlaying ? "contextMenu.pause" : "contextMenu.play")} ${song.name}`}
            className={cn(
              "absolute right-5 bottom-5 flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground focus-visible:outline-2 focus-visible:outline-ring",
            )}
          >
            {activeIsPlaying ? (
              <Pause className="size-4 fill-current" />
            ) : (
              <Play className="ml-0.5 size-4 fill-current" />
            )}
          </button>
        </Card>
      </SongContextMenu>
      <SearchLyricDialog
        song={song}
        item={item}
        highlightKeyword={highlightKeyword}
        isPlaying={activeIsPlaying}
        onPlay={onPlay}
      />
    </Dialog>
  );
});
