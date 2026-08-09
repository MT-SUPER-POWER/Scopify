import { formatNumber } from "@/lib/utils";
import { useI18n } from "@/store/module/i18n";
import type { ArtistInfo } from "@/types/artist";

interface Props {
  artist: ArtistInfo;
}

export function AboutSection({ artist }: Props) {
  const { t } = useI18n();

  return (
    <div className="xl:w-80">
      <h2 className="mb-4 text-2xl font-bold">{t("artist.about.title")}</h2>
      <div className="bg-content/5 hover:bg-content/10 group relative cursor-pointer overflow-hidden rounded-xl transition-colors">
        <div
          className="h-64 w-full bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
          style={{ backgroundImage: `url(${artist.avatar})` }}
        />
        <div className="from-overlay via-overlay/50 absolute inset-0 flex flex-col justify-end bg-linear-to-t to-transparent p-5">
          <p className="text-overlay-foreground mb-2 font-bold">
            {t("artist.about.monthlyListeners", { count: formatNumber(artist.listeners) })}
          </p>
          <p className="text-overlay-foreground/80 line-clamp-3 text-sm leading-relaxed">
            {artist.bio}
          </p>
        </div>
      </div>
    </div>
  );
}
