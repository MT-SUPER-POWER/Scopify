import { BadgeCheck } from "lucide-react";
import { formatNumber } from "@/lib/utils";
import { useI18n } from "@/store/module/i18n";
import type { ArtistInfo } from "@/types/artist";

interface Props {
  artist: ArtistInfo;
}

export function ArtistHero({ artist }: Props) {
  const { t } = useI18n();

  return (
    <div className="relative flex h-[40vh] min-h-85 w-full items-end md:h-[50vh]">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${artist.headerImageUrl})` }}
      />
      <div className="absolute inset-0 bg-linear-to-t from-[#121212] via-[#121212]/70 to-transparent" />
      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-2 p-6 md:p-8">
        {artist.isVerified && (
          <div className="flex items-center gap-2 text-sm font-medium drop-shadow-md md:text-base">
            <BadgeCheck className="size-5 text-[#1DB954]" fill="white" />
            <span>{t("artist.hero.verified")}</span>
          </div>
        )}
        <h1 className="mb-4 text-5xl font-black tracking-tighter drop-shadow-xl md:text-7xl lg:text-8xl">
          {artist.name}
        </h1>
        <p className="text-sm font-medium text-gray-300 drop-shadow-md md:text-base">
          {t("artist.hero.listeners", { count: formatNumber(artist.listeners) })}
        </p>
      </div>
    </div>
  );
}
