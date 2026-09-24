"use client";

import { useState } from "react";
import { toast } from "sonner";
import { getSongDetail } from "@/lib/api/track";
import { getPlaylistAllTracks } from "@/lib/api/playlist";
import { getAlbumDetail } from "@/lib/api/album";
import { usePlayerStore } from "@/store/module/player";
import { useI18n } from "@/store/module/i18n";
import { pruneSongDetail } from "@/types/api/music";
import type { RawSongDetail } from "@/types/api/music";
import type { SocialResource } from "@/types/social";

export function useSocialPlayback(resource: SocialResource) {
  const [pending, setPending] = useState(false);
  const { t } = useI18n();
  async function play(queueOnly = false) {
    if (pending) return;
    setPending(true);
    try {
      let raw: RawSongDetail[];
      if (resource.kind === "song") raw = (await getSongDetail(resource.id)).data.songs ?? [];
      else if (resource.kind === "playlist")
        raw = (await getPlaylistAllTracks({ id: resource.id })).data.songs ?? [];
      else if (resource.kind === "album")
        raw = (await getAlbumDetail(resource.id)).data.songs ?? [];
      else return;
      const songs = raw.map(pruneSongDetail);
      if (!songs.length) throw new Error("No playable tracks");
      const player = usePlayerStore.getState();
      if (queueOnly) {
        const existing = new Set(player.queue.map((song) => song.id));
        player.setQueue(
          [...player.queue, ...songs.filter((song) => !existing.has(song.id))],
          player.queueIndex,
        );
        toast.success(t("social.queued"));
      } else {
        player.setQueue(songs, 0);
        await player.playQueueIndex(0);
      }
    } catch {
      toast.error(t("social.actionFailed"));
    } finally {
      setPending(false);
    }
  }
  return { play, pending, playable: ["song", "playlist", "album"].includes(resource.kind) };
}
