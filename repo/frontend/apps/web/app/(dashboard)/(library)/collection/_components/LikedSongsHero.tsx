"use client";

import type { MusicLibraryPlaylist } from "@scopify/music-domain/library";
import { musicResourceKey } from "@scopify/music-domain/identity";
import { Heart, Play, Shuffle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import { NewSongItem } from "@/components/home/NewSongItem";
import { useHomePlaybackActions } from "@/hooks/home/useHomePlaybackActions";
import { usePlaylist } from "@/hooks/playlist/usePlaylistData";
import { getSizedImageUrl } from "@/lib/music/imageUrl";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

/** How many liked songs the hero previews. */
const PREVIEW_COUNT = 6;

/** The liked songs as the page's lead: a cover to play from, and the newest songs beside it. */
export function LikedSongsHero({ liked }: { liked: MusicLibraryPlaylist }) {
  const { t } = useTranslation();
  const actions = useHomePlaybackActions();
  const { tracks } = usePlaylist(liked.playlist.ref.id);
  const preview = useMemo(() => tracks.slice(0, PREVIEW_COUNT), [tracks]);
  const cover = getSizedImageUrl(liked.playlist.coverUrl, 400);
  const count = liked.playlist.trackCount;
  const hasPreview = preview.length > 0;

  return (
    <section
      className={cn(
        "overflow-hidden rounded-3xl bg-linear-to-br from-brand/25 via-content/5 to-transparent p-6 lg:p-8",
        hasPreview
          ? "grid gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]"
          : "flex flex-wrap items-center gap-x-8 gap-y-4",
      )}
    >
      <div className={cn("flex gap-5", hasPreview ? "flex-col" : "items-center")}>
        <Link
          href="/liked"
          className={cn(
            "relative aspect-square overflow-hidden rounded-2xl bg-surface-elevated shadow-panel",
            hasPreview ? "w-full max-w-60" : "w-32 shrink-0",
          )}
        >
          {cover ? (
            <Image src={cover} alt="" fill sizes="240px" className="object-cover" />
          ) : (
            <Heart className="absolute inset-0 m-auto size-16 fill-brand text-brand" />
          )}
        </Link>
        <div>
          <Link href="/liked" className="text-2xl font-bold tracking-tight text-content">
            {t("sidebar.library.likedMusic")}
          </Link>
          <p className="mt-1 text-sm text-content-muted">{t("home.playlistSummary", { count })}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={preview.length === 0}
            onClick={() => void actions.playTracks(tracks, 0)}
            className="flex cursor-pointer items-center gap-2 rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-brand-foreground shadow-brand transition-transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
          >
            <Play className="size-4 fill-current" />
            {t("home.playAll")}
          </button>
          <button
            type="button"
            disabled={preview.length === 0}
            aria-label={t("album.action.shuffle")}
            onClick={() =>
              void actions.playTracks(tracks, Math.floor(Math.random() * tracks.length))
            }
            className="flex size-10 cursor-pointer items-center justify-center rounded-full bg-content/10 text-content transition-colors hover:bg-content/20 disabled:opacity-50"
          >
            <Shuffle className="size-4" />
          </button>
        </div>
      </div>

      <div className="min-w-0 self-center">
        {preview.length > 0 ? (
          <>
            <ul className="grid gap-x-4 gap-y-1 md:grid-cols-2">
              {preview.map((track, index) => (
                <li key={musicResourceKey(track.ref)}>
                  <NewSongItem
                    song={track}
                    index={index}
                    onPlay={(_song, at) => actions.playTracks(tracks, at)}
                  />
                </li>
              ))}
            </ul>
            {count > PREVIEW_COUNT && (
              <Link
                href="/liked"
                className="mt-3 inline-block text-sm font-medium text-content-muted transition-colors hover:text-content"
              >
                {t("library.collection.viewAllLiked", { count })}
              </Link>
            )}
          </>
        ) : (
          <p className="text-sm text-content-muted">{t("library.empty.liked.description")}</p>
        )}
      </div>
    </section>
  );
}
