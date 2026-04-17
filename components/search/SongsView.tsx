import type { Song } from "@/types/search";
import { useI18n } from "@/store/module/i18n";
import { SongsPanel } from "./SongsPanel";

interface Props {
  songs: Song[];
}

export function SongsView({ songs }: Props) {
  const { t } = useI18n();

  return (
    <div className="pb-10">
      <h2 className="text-2xl font-bold mb-6 tracking-tight">{t("search.section.searchSongs")}</h2>
      <SongsPanel songs={songs} />
    </div>
  );
}
