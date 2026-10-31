import { BadgeCheck } from "lucide-react";
import { formatNumber } from "@/lib/utils";
import { useTranslation } from "react-i18next";

import type { ArtistInfo } from "@/types/artist/model";
import { getSizedImageUrl } from "@/lib/music/imageUrl";

interface Props {
  artist: ArtistInfo;
}

export function ArtistHero({ artist }: Props) {
  const { t } = useTranslation();

  return (
    <div className="relative flex h-[40vh] min-h-85 w-full items-end md:h-[50vh]">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${getSizedImageUrl(artist.headerImageUrl, 1600)})` }}
      />
      <div className="absolute inset-0 bg-linear-to-t from-surface-raised via-surface-raised/70 to-transparent" />
      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-2 p-6 md:p-8">
        {artist.isVerified && (
          <div className="flex items-center gap-2 text-sm font-medium text-content md:text-base">
            <BadgeCheck className="size-5 text-brand" fill="var(--scopify-overlay-foreground)" />
            <span>{t("artist.hero.verified")}</span>
          </div>
        )}
        <h1 className="mb-4 text-5xl font-black tracking-tighter text-content md:text-7xl lg:text-8xl">
          {artist.name}
        </h1>
        <p className="text-sm font-medium text-content-muted md:text-base">
          {t("artist.hero.listeners", {
            count: artist.listeners,
            replace: { count: formatNumber(artist.listeners) },
          })}
        </p>
      </div>
    </div>
  );
}
