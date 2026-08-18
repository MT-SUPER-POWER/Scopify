"use client";

import { VoiceTranscriptPanel } from "@/components/voice/VoiceTranscriptPanel";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import { useVoiceTranscriptQuery } from "@/hooks/voice/useVoiceTranscriptQuery";
import type { Voice } from "@/types/search";

interface VoiceTranscriptPopoverProps {
  children: React.ReactNode;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  voice: Voice;
}

export function VoiceTranscriptPopover({
  children,
  onOpenChange,
  open,
  voice,
}: VoiceTranscriptPopoverProps) {
  const transcriptQuery = useVoiceTranscriptQuery(voice.id, open);

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverAnchor asChild>
        <div className="block min-w-0">{children}</div>
      </PopoverAnchor>
      <PopoverContent
        align="start"
        sideOffset={8}
        className="w-[min(24rem,calc(100vw-2rem))] border border-content/10 bg-surface-elevated p-0 text-content shadow-2xl"
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <VoiceTranscriptPanel
          isError={transcriptQuery.isError}
          isLoading={transcriptQuery.isLoading}
          sentences={transcriptQuery.data?.sents ?? []}
          voice={voice}
        />
      </PopoverContent>
    </Popover>
  );
}
