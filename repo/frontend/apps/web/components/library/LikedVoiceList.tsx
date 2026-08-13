"use client";

import { useState } from "react";
import { VoiceList } from "@/components/search/VoiceList";
import { VoiceTranscriptDialog } from "@/components/voice/VoiceTranscriptDialog";
import type { Voice } from "@/types/search";

interface LikedVoiceListProps {
  voices: Voice[];
}

export function LikedVoiceList({ voices }: LikedVoiceListProps) {
  const [selectedVoice, setSelectedVoice] = useState<Voice | null>(null);

  return (
    <>
      <VoiceList voices={voices} variant="liked" onViewTranscript={setSelectedVoice} />
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
