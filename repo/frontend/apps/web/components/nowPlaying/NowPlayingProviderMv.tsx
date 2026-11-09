"use client";

import { NowPlayingCard } from "./NowPlayingCard";
import { MvListItem } from "@/components/mv/MvListItem";
import { useProviderCapability } from "@/hooks/provider/useActiveProvider";
import { useMvDetailQuery } from "@/hooks/mv/useMVQueries";
import { useTranslation } from "react-i18next";

import type { PlayerTrack } from "@/types/player/model";

/** The MV board of a platform without NetEase's in-panel player: the song's MV, opened on its page. */
export function NowPlayingProviderMv({ track }: { track: PlayerTrack }) {
  const { t } = useTranslation();
  const hasMv = useProviderCapability("mv");
  const mvId = track.mvId;
  const detail = useMvDetailQuery(
    mvId ? { provider: track.ref.provider, kind: "mv", id: mvId } : null,
    { enabled: hasMv },
  );
  if (!hasMv || !mvId || !detail.data) return null;

  return (
    <NowPlayingCard title={t("nowPlaying.mvs")} className="pb-2">
      <ul className="mt-2 flex flex-col px-2">
        <li>
          <MvListItem
            mv={detail.data}
            href={`/mv?id=${mvId}`}
            badge={
              <span className="shrink-0 rounded-sm bg-content/10 px-1 text-[10px] leading-4 font-bold text-content">
                {t("nowPlaying.songMv")}
              </span>
            }
          />
        </li>
      </ul>
    </NowPlayingCard>
  );
}
