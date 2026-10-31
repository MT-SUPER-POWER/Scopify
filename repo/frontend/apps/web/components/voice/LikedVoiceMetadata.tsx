import { formatPlayCount } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { useI18nStore } from "@/store/module/i18n";
import type { Voice } from "@/types/search/model";

function formatVoiceDate(timestamp: number, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(timestamp));
}

interface LikedVoiceMetadataProps {
  voice: Voice;
}

export function LikedVoiceMetadata({ voice }: LikedVoiceMetadataProps) {
  const { t } = useTranslation(),
    locale = useI18nStore((state) => state.locale);
  const date = (timestamp: number) => formatVoiceDate(timestamp, locale);
  const metadata = [
    voice.likeTime ? t("library.voice.meta.likedAt", { date: date(voice.likeTime) }) : null,
    voice.lastPlayTime
      ? t("library.voice.meta.lastPlayedAt", { date: date(voice.lastPlayTime) })
      : null,
    voice.publishTime
      ? t("library.voice.meta.publishedAt", { date: date(voice.publishTime) })
      : null,
    typeof voice.playCount === "number"
      ? t("library.voice.meta.playCount", {
          count: voice.playCount,
          replace: { count: formatPlayCount(voice.playCount) },
        })
      : null,
  ].filter((item): item is string => Boolean(item));

  return (
    <>
      {voice.description ? (
        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-content-subtle">
          {voice.description}
        </p>
      ) : null}
      {metadata.length > 0 ? (
        <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-content-subtle">
          {metadata.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </p>
      ) : null}
    </>
  );
}
