import { useI18n } from "@/store/module/i18n";
import type { VoicesViewProps } from "@/types/components/search";
import { VoiceList } from "./VoiceList";

export function VoicesView({ voices }: VoicesViewProps) {
  const { t } = useI18n();

  return (
    <div className="pb-10">
      <h2 className="mb-6 text-2xl font-bold tracking-tight">{t("search.section.searchVoices")}</h2>
      <VoiceList voices={voices} />
    </div>
  );
}
