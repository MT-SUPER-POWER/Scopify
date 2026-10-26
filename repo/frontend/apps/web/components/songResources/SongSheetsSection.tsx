"use client";

import { FileMusic } from "lucide-react";
import { useState } from "react";
import { QueryBoundary } from "@/components/shared/QueryBoundary";
import { QueryPending } from "@/components/shared/QueryPending";
import { QuietState } from "@/components/shared/QuietState";
import { useSongSheetsQuery } from "@/hooks/song/useSongResources";
import { useRequireLoginAction } from "@/lib/hooks/useRequireLoginAction";
import { useI18n } from "@/store/module/i18n";
import type { MusicSheet } from "@/types/api/songResources";
import type { SongResourceSectionProps } from "@/types/components/songResources";
import { MusicSheetRow } from "./MusicSheetRow";
import { SheetPreviewDialog } from "./SheetPreviewDialog";

export function SongSheetsSection(props: SongResourceSectionProps) {
  return (
    <QueryBoundary compact resetKey={`song-sheets:${props.songId}`}>
      <SongSheetsContent key={props.songId} {...props} />
    </QueryBoundary>
  );
}
function SongSheetsContent({ songId, compact }: SongResourceSectionProps) {
  const { t } = useI18n();
  const query = useSongSheetsQuery(songId);
  const requireLogin = useRequireLoginAction();
  const [selected, setSelected] = useState<MusicSheet | null>(null);
  if (songId <= 0)
    return <QuietState compact icon={FileMusic} title={t("songResources.emptySheets")} />;
  if (query.data === undefined) return <QueryPending isPaused={query.fetchStatus === "paused"} />;
  if (query.data.length === 0)
    return <QuietState compact icon={FileMusic} title={t("songResources.emptySheets")} />;
  return (
    <>
      <ul className="space-y-1">
        {(compact ? query.data.slice(0, 3) : query.data).map((sheet) => (
          <li key={sheet.id}>
            <MusicSheetRow
              sheet={sheet}
              onSelect={(item) => void requireLogin(() => setSelected(item))}
            />
          </li>
        ))}
      </ul>
      <SheetPreviewDialog sheet={selected} onClose={() => setSelected(null)} />
    </>
  );
}
