"use client";

import { useState } from "react";

import { CollapsibleSection } from "@/components/home/CollapsibleSection";
import { VoiceList } from "@/components/search/VoiceList";
import { VoiceTranscriptDialog } from "@/components/voice/VoiceTranscriptDialog";
import { useI18n } from "@/store/module/i18n";
import type { Voice } from "@/types/search";

interface RecommendedVoiceListsProps {
  voices: Voice[];
}

export function RecommendedVoiceLists({ voices }: RecommendedVoiceListsProps) {
  const { t } = useI18n();
  const [selectedVoice, setSelectedVoice] = useState<Voice | null>(null);

  if (voices.length === 0) return null;

  return (
    <section>
      <CollapsibleSection
        title={
          <h2 className="text-content text-2xl font-bold tracking-tight hover:underline">
            {t("home.recommendedVoiceLists")}
          </h2>
        }
        collapsedHeight="244px"
      >
        <VoiceList voices={voices} variant="preview" onViewTranscript={setSelectedVoice} />
      </CollapsibleSection>
      <VoiceTranscriptDialog
        open={selectedVoice !== null}
        voice={selectedVoice}
        onOpenChange={(open) => {
          if (!open) setSelectedVoice(null);
        }}
      />
    </section>
  );
}
