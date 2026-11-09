import { musicResourceKey } from "@scopify/music-domain/identity";
import Link from "next/link";
import { useTranslation } from "react-i18next";

import type { ArtistInfo } from "@/types/artist/model";
import type { PlayerTrack } from "@/types/player/model";
import { PopularTrackItem } from "./PopularTrackItem";

interface Props {
  tracks: readonly PlayerTrack[];
  artist: ArtistInfo;
}

export function PopularTracks({ tracks, artist }: Props) {
  const { t } = useTranslation();
  const visibleTracks = tracks.slice(0, 10);

  return (
    <div className="flex-1">
      <h2 className="mb-4 text-2xl font-bold">{t("artist.popular.title")}</h2>
      {tracks.length > 0 ? (
        <div className="flex flex-col">
          {visibleTracks.map((track, i) => (
            <PopularTrackItem
              key={musicResourceKey(track.ref)}
              track={track}
              index={i}
              queue={tracks}
            />
          ))}
          {tracks.length > 10 && (
            <Link
              href={`/artist/songs?id=${artist.id}`}
              className="mt-4 w-fit rounded-full border border-content/10 px-4 py-2 text-sm font-semibold text-content-muted transition hover:border-content/30 hover:text-content"
            >
              {t("common.action.showAll")}
            </Link>
          )}
        </div>
      ) : (
        <div className="py-4 text-sm text-content-subtle">{t("artist.popular.noTracks")}</div>
      )}
    </div>
  );
}
