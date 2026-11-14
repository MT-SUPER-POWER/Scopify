"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { VoiceList } from "@/components/search/VoiceList";
import { VoiceTranscriptDialog } from "@/components/voice/VoiceTranscriptDialog";
import type { LikedVoiceListProps } from "@/types/library/components";
import type { Voice } from "@/types/search/model";

export function LikedVoiceList({ voices }: LikedVoiceListProps) {
  const { t } = useTranslation();
  const [selectedVoice, setSelectedVoice] = useState<Voice | null>(null);

  return (
    <>
      <div className="@container/liked-voices">
        <div className="flex items-center gap-2 border-b border-content/10 px-2 pb-2 text-xs font-medium text-content-muted sm:gap-3 sm:px-3">
          <span className="hidden w-6 shrink-0 text-center sm:block">#</span>
          <span className="min-w-0 flex-1">{t("library.podcasts.column.title")}</span>
          <span className="hidden w-32 shrink-0 text-right @min-[40rem]/liked-voices:block">
            {t("library.podcasts.column.likedAt")}
          </span>
          <span className="w-10 shrink-0 text-right">{t("library.podcasts.column.duration")}</span>
          <span className="w-17 shrink-0" aria-hidden="true" />
        </div>
        <VoiceList
          enableContextMenu
          voices={voices}
          variant="liked"
          onViewTranscript={setSelectedVoice}
        />
      </div>
      <VoiceTranscriptDialog
        open={selectedVoice !== null}
        voice={selectedVoice}
        onOpenChange={(open) => {
          if (!open) setSelectedVoice(null);
        }}
      />
    </>
  );
}
