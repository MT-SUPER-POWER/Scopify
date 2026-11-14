import { useI18nStore } from "@/store/module/i18n";
import type { LikedVoiceMetadataProps } from "@/types/library/components";

export function LikedVoiceMetadata({ voice }: LikedVoiceMetadataProps) {
  const locale = useI18nStore((state) => state.locale);
  const likedAt = voice.likeTime ? new Date(voice.likeTime) : null;
  const label =
    likedAt && Number.isFinite(likedAt.getTime())
      ? new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(likedAt)
      : "—";

  return (
    <span className="hidden w-32 shrink-0 truncate text-right text-xs text-content-muted tabular-nums @min-[40rem]/liked-voices:block">
      {label}
    </span>
  );
}
