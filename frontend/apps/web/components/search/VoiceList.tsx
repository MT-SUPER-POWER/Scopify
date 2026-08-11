import { useI18n } from "@/store/module/i18n";
import type { VoiceListProps } from "@/types/components/search";
import { VoiceItem } from "./VoiceItem";

export function VoiceList({
  enableContextMenu = false,
  layout = "list",
  limit,
  onViewAll,
  onViewTranscript,
  transcriptMode = "dialog",
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
          : layout === "grid"
            ? "grid w-full grid-cols-1 gap-2 md:grid-cols-2 2xl:grid-cols-3"
            : "flex w-full flex-col"
      }
    >
      {displayedVoices.map((voice, index) => (
        <VoiceItem
          enableContextMenu={enableContextMenu}
          key={voice.id}
          index={index}
          onViewTranscript={onViewTranscript}
          transcriptMode={transcriptMode}
          variant={variant}
          voice={voice}
          voices={voices}
        />
      ))}
      {voices.length === 0 && (
        <p className="text-content-subtle py-4 text-sm">{t("search.section.noVoiceResults")}</p>
      )}
      {onViewAll && voices.length > (limit ?? 0) && (
        <button
          type="button"
          onClick={onViewAll}
          className="text-content-muted hover:text-content col-span-full mt-3 self-start text-sm font-bold hover:underline"
        >
          {t("common.action.viewAll")}
        </button>
      )}
    </div>
  );
}
