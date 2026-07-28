"use client";

import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { getRadioDetail, getRadioPrograms } from "@/lib/api/radio";
import { musicQueryKeys } from "@/lib/query/queryKeys";
import { formatDate, getMainColorFromImage } from "@/lib/utils";
import { useI18n } from "@/store/module/i18n";
import { pruneSongDetail, type SongDetail } from "@/types/api/music";
import type {
  RadioDetail,
  RadioDetailPayload,
  RadioDetailResponse,
  RadioHost,
  RadioProgram,
  RadioProgramsResponse,
} from "@/types/api/radio";
import type { PlaylistInfo } from "@/types/playlist";
import type { RadioContent } from "@/types/radio";

function getPrograms(response: RadioProgramsResponse) {
  return response.data?.programs ?? response.programs ?? [];
}

function isRadioDetail(payload: RadioDetailPayload | undefined): payload is RadioDetail {
  return Boolean(payload && "id" in payload && "name" in payload);
}

function getRadio(response: RadioDetailResponse, programs: RadioProgram[]): RadioDetail | null {
  if (isRadioDetail(response.data)) return response.data;

  return response.data?.djRadio ?? response.djRadio ?? programs[0]?.radio ?? null;
}

function getHost(radio: RadioDetail, programs: RadioProgram[]): RadioHost | undefined {
  return radio.dj ?? programs.find((program) => program.dj)?.dj;
}

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

async function fetchRadioContent(radioId: string): Promise<RadioContent> {
  const [detailResponse, programsResponse] = await Promise.all([
    getRadioDetail(radioId),
    getRadioPrograms({ id: radioId }),
  ]);
  const programs = getPrograms(programsResponse.data);
  const radio = getRadio(detailResponse.data, programs);
  if (!radio) throw new Error("Radio detail is missing.");

  return {
    host: getHost(radio, programs),
    radio,
    tracks: programs.map((program) => toRadioTrack(program, radio)),
  };
}

export function useRadioData() {
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const radioId = searchParams.get("id");
  const radioQuery = useQuery({
    enabled: Boolean(radioId),
    meta: {
      persist: true,
      scope: "account",
    },
    queryFn: () => fetchRadioContent(radioId ?? ""),
    queryKey: musicQueryKeys.radio.content(radioId ?? ""),
  });
  const content = radioQuery.data;
  const playlistInfo = useMemo<PlaylistInfo | null>(() => {
    if (!content) return null;

    const { host, radio, tracks } = content;
    const tags = [radio.category, radio.secondCategory].filter((tag): tag is string =>
      Boolean(tag),
    );

    return {
      cover: radio.picUrl ?? null,
      createTime: radio.createTime ? formatDate(radio.createTime) : t("playlist.meta.unknownDate"),
      creator: host?.nickname ?? t("common.meta.unknownUser"),
      creatorAvatar: host?.avatarUrl ?? "",
      creatorID: host?.userId ?? null,
      description: radio.desc,
      isSpecial: false,
      likes: radio.subCount ?? 0,
      likesLabel: t("library.podcasts.subscribers", { count: radio.subCount ?? 0 }),
      privacy: t("library.title.podcasts"),
      tags,
      title: radio.name,
      totalSongs: radio.programCount ?? tracks.length,
      totalSongsLabel: t("library.podcasts.episodes", {
        count: radio.programCount ?? tracks.length,
      }),
    };
  }, [content, t]);
  const coverUrl = playlistInfo?.cover;
  const [themeColor, setThemeColor] = useState("#69472e");

  useEffect(() => {
    if (!coverUrl) return;

    getMainColorFromImage(coverUrl).then((color) => {
      if (color) setThemeColor(color);
    });
  }, [coverUrl]);

  return {
    isLoading: radioQuery.isPending,
    playlistInfo,
    radioId,
    refetchTracks: radioQuery.refetch,
    themeColor,
    tracks: content?.tracks ?? [],
  };
}
