"use client";

import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";

import { getSongDetail } from "@/lib/api/track";
import { usePlayerStore } from "@/store";
import { useTranslation } from "react-i18next";

export function useReportSongPlayback() {
  const { t } = useTranslation();
  const [playingSongId, setPlayingSongId] = useState<number | null>(null);
  const requestSequence = useRef(0);

  const playSong = useCallback(
    async (songId: number) => {
      const requestId = ++requestSequence.current;
      try {
        setPlayingSongId(songId);
        const response = await getSongDetail(songId);
        if (requestId !== requestSequence.current) return;
        const song = response?.data?.songs?.[0];

        if (!song) {
          toast.error("暂时无法播放这首歌");
          return;
        }

        usePlayerStore.getState().playFromSong(song, [song]);
        toast.success(`${t("library.listeningReport.playAction")}: ${song.name}`);
      } catch {
        if (requestId === requestSequence.current) toast.error("播放歌曲失败");
      } finally {
        if (requestId === requestSequence.current) setPlayingSongId(null);
      }
    },
    [t],
  );

  return { playSong, playingSongId };
}
