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
      <div className="from-surface-raised via-surface-raised/70 absolute inset-0 bg-linear-to-t to-transparent" />
      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-2 p-6 md:p-8">
        {artist.isVerified && (
          <div className="text-content flex items-center gap-2 text-sm font-medium md:text-base">
            <BadgeCheck className="text-brand size-5" fill="var(--overlay-foreground)" />
            <span>{t("artist.hero.verified")}</span>
          </div>
        )}
        <h1 className="text-content mb-4 text-5xl font-black tracking-tighter md:text-7xl lg:text-8xl">
          {artist.name}
        </h1>
        <p className="text-content-muted text-sm font-medium md:text-base">
          {t("artist.hero.listeners", { count: formatNumber(artist.listeners) })}
        </p>
      </div>
    </div>
  );
}
