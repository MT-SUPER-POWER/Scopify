"use client";

import { Music, Pause, Play } from "lucide-react";
import { useRouter } from "next/navigation";
import { usePlaybackCommands } from "@/hooks/player/usePlaybackCommands";
import { usePlaybackProjection } from "@/hooks/player/usePlaybackProjection";
import { usePlayerStore } from "@/store";
import { cn } from "@/lib/utils";
import type { CommandWorkspaceNowPlayingProps } from "@/types/commandWorkspace/model";

export function CommandWorkspacePlaybackTrack({ onClose }: CommandWorkspaceNowPlayingProps) {
  const router = useRouter();
  const commands = usePlaybackCommands();
  const projection = usePlaybackProjection();
  const currentSong = usePlayerStore((state) => state.currentTrack);
  if (!currentSong) return null;
  const isPlaying = projection.isPlaying;
  const coverUrl = currentSong.album?.coverUrl
    ? `${currentSong.album?.coverUrl}?param=400y400`
    : null;
  // Artist and album pages are NetEase-only; other platforms show plain names.
  const canNavigate = currentSong.ref.provider === "netease";
  const albumId =
    canNavigate && currentSong.album?.ref.id !== "0" ? currentSong.album?.ref.id : null;
  const navigateToArtist = (artistId: string) => {
    router.push(`/artist?id=${artistId}`, { scroll: false });
    onClose?.();
  };
  const navigateToAlbum = (albumId: string) => {
    router.push(`/album?id=${albumId}`, { scroll: false });
    onClose?.();
  };
  return (
    <div className="flex items-center gap-4 rounded-xl border border-border bg-content/3 p-3.5 backdrop-blur-md">
      {/* 高清封面 */}
      <button
        type="button"
        onClick={() => void commands.toggle()}
        className="group hover:scale-1.02 relative size-20 shrink-0 overflow-hidden rounded-lg bg-content/8 shadow-md transition-transform focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:size-24"
        title={isPlaying ? "暂停" : "播放"}
      >
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={currentSong.title}
            loading="eager"
            className="size-full object-cover"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-content-muted">
            <Music className="size-8" />
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
          {isPlaying ? (
            <Pause className="size-6 fill-white text-white" />
          ) : (
            <Play className="size-6 translate-x-0.5 fill-white text-white" />
          )}
        </div>
      </button>

      {/* 歌曲与歌手信息 */}
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase",
              isPlaying
                ? "border border-brand/30 bg-brand/15 text-brand"
                : "border border-border/60 bg-surface-elevated/60 text-content-muted",
            )}
          >
            {isPlaying ? (
              <>
                <span className="size-1.5 animate-ping rounded-full bg-brand" />
                正在播放
              </>
            ) : (
              "已暂停"
            )}
          </span>
        </div>

        <h3 className="truncate text-base font-bold tracking-tight text-content sm:text-lg">
          {currentSong.title}
        </h3>

        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-content-muted">
          {/* 歌手 */}
          <span className="truncate">
            {currentSong.artists?.map((artist, aIndex) => (
              <span key={`${artist.ref.id || artist.name}-${aIndex}`}>
                {canNavigate && artist.ref.id !== "0" ? (
                  <button
                    type="button"
                    onClick={() => navigateToArtist(artist.ref.id)}
                    className="transition-colors hover:text-content hover:underline focus-visible:text-content"
                  >
                    {artist.name}
                  </button>
                ) : (
                  <span>{artist.name}</span>
                )}
                {aIndex < (currentSong.artists?.length ?? 0) - 1 ? " / " : ""}
              </span>
            ))}
          </span>

          {/* 专辑 */}
          {currentSong.album?.title ? (
            <>
              <span className="text-content-subtle">·</span>
              {albumId ? (
                <button
                  type="button"
                  onClick={() => navigateToAlbum(albumId)}
                  title={currentSong.album?.title}
                  className="max-w-45 truncate transition-colors hover:text-content hover:underline focus-visible:text-content"
                >
                  {currentSong.album?.title}
                </button>
              ) : (
                <span className="max-w-45 truncate">{currentSong.album?.title}</span>
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
