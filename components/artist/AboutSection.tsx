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
      <div className="group relative cursor-pointer overflow-hidden rounded-xl bg-white/5 transition-colors hover:bg-white/10">
        <div
          className="h-64 w-full bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
          style={{ backgroundImage: `url(${artist.avatar})` }}
        />
        <div className="absolute inset-0 flex flex-col justify-end bg-linear-to-t from-black/90 via-black/40 to-transparent p-5">
          <p className="mb-2 font-bold">
            {t("artist.about.monthlyListeners", { count: formatNumber(artist.listeners) })}
          </p>
          <p className="line-clamp-3 text-sm leading-relaxed text-gray-300">{artist.bio}</p>
        </div>
      </div>
    </div>
  );
}
