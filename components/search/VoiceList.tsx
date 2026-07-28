import { useI18n } from "@/store/module/i18n";
import type { VoiceListProps } from "@/types/components/search";
import { VoiceItem } from "./VoiceItem";

export function VoiceList({
  limit,
  onViewAll,
  onViewTranscript,
  variant = "default",
  voices,
}: VoiceListProps) {
  const { t } = useI18n();
  const displayedVoices = limit ? voices.slice(0, limit) : voices;

  return (
    <div
      className={
        variant === "preview"
          ? "grid w-full grid-cols-1 gap-x-12 gap-y-5 lg:grid-cols-2"
          : "flex w-full flex-col"
      }
    >
      {displayedVoices.map((voice, index) => (
        <VoiceItem
          key={voice.id}
          index={index}
          onViewTranscript={onViewTranscript}
          variant={variant}
          voice={voice}
          voices={voices}
        />
      ))}
      {voices.length === 0 && (
        <p className="py-4 text-sm text-zinc-500">{t("search.section.noVoiceResults")}</p>
      )}
      {onViewAll && voices.length > (limit ?? 0) && (
        <button
          type="button"
          onClick={onViewAll}
          className="col-span-full mt-3 self-start text-sm font-bold text-zinc-400 hover:text-white hover:underline"
        >
          {t("common.action.viewAll")}
        </button>
      )}
    </div>
  );
}
