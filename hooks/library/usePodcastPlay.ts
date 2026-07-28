"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";

import { getRadioDetail, getRadioPrograms } from "@/lib/api/radio";
import { usePlayerStore } from "@/store";
import { useI18n } from "@/store/module/i18n";
import { pruneSongDetail, type SongDetail } from "@/types/api/music";
import type { RadioDetail, RadioProgram } from "@/types/api/radio";

function toRadioTrack(program: RadioProgram, radio: RadioDetail): SongDetail {
  const track = pruneSongDetail(program.mainSong);
  const coverUrl = program.coverUrl ?? track.al.picUrl ?? radio.picUrl ?? "";

  return {
    ...track,
    al: {
      ...track.al,
      id: radio.id,
      name: radio.name,
      picUrl: coverUrl,
    },
    dt: program.duration ?? track.dt,
    name: program.name ?? track.name,
    publishTime: program.createTime ?? track.publishTime,
  };
}

export function usePodcastPlay() {
  const [loadingPodcastId, setLoadingPodcastId] = useState<string | number | null>(null);
  const { setQueue, playQueueIndex } = usePlayerStore();
  const { t } = useI18n();

  const handlePlayPodcast = useCallback(
    async (id: string | number, e?: React.MouseEvent) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      if (loadingPodcastId === id) return;

      setLoadingPodcastId(id);
      try {
        const [detailResponse, programsResponse] = await Promise.all([
          getRadioDetail(id),
          getRadioPrograms({ id, limit: 200 }),
        ]);

        const programs = programsResponse.data?.programs ?? programsResponse.programs ?? [];
        const radio =
          detailResponse.data?.djRadio ??
          detailResponse.data ??
          (programs[0]?.radio as RadioDetail | undefined);

        if (!programs.length || !radio) {
          toast.error(t("library.podcasts.toast.empty"));
          return;
        }

        const tracks = programs.map((program) => toRadioTrack(program, radio));
        setQueue(tracks, 0, `radio:${id}`);
        await playQueueIndex(0);
      } catch (error) {
        console.error("Failed to play podcast:", error);
        toast.error(t("library.podcasts.toast.loadFailed"));
      } finally {
        setLoadingPodcastId(null);
      }
    },
    [loadingPodcastId, setQueue, playQueueIndex, t],
  );

  return {
    handlePlayPodcast,
    loadingPodcastId,
  };
}
