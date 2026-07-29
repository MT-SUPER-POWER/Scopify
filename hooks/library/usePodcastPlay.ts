"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";

import { getRadioDetail, getRadioPrograms } from "@/lib/api/radio";
import { usePlayerStore } from "@/store";
import { useI18n } from "@/store/module/i18n";
import { pruneSongDetail, type SongDetail } from "@/types/api/music";
import type { RadioDetail, RadioDetailResponse, RadioProgram } from "@/types/api/radio";

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

async function fetchAllRadioPrograms(id: number | string): Promise<RadioProgram[]> {
  const programs: RadioProgram[] = [];
  let hasMore = true;
  let offset = 0;

  while (hasMore) {
    const response = await getRadioPrograms({ id, limit: 200, offset });
    const page = response.data.data?.programs ?? response.data.programs ?? [];

    programs.push(...page);
    if (page.length === 0) break;

    offset += page.length;
    hasMore = response.data.data?.more ?? response.data.more ?? false;
  }

  return programs;
}

function getRadioFromResponse(
  response: RadioDetailResponse,
  programs: RadioProgram[],
): RadioDetail | null {
  const payload = response.data;
  if (payload && "id" in payload) return payload;

  return payload?.djRadio ?? response.djRadio ?? programs[0]?.radio ?? null;
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
        const [detailResponse, programs] = await Promise.all([
          getRadioDetail(id),
          fetchAllRadioPrograms(id),
        ]);

        const radio = getRadioFromResponse(detailResponse.data, programs);

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
