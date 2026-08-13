"use client";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { VoiceTranscriptPanel } from "@/components/voice/VoiceTranscriptPanel";
import { useVoiceTranscriptQuery } from "@/hooks/voice/useVoiceTranscriptQuery";
import { useI18n } from "@/store/module/i18n";
import type { Voice } from "@/types/search";

interface VoiceTranscriptDialogProps {
  onOpenChange: (open: boolean) => void;
  open: boolean;
  voice: Voice | null;
}

export function VoiceTranscriptDialog({ onOpenChange, open, voice }: VoiceTranscriptDialogProps) {
  const { t } = useI18n();
  const transcriptQuery = useVoiceTranscriptQuery(voice?.id ?? null, open);
  const sentences = transcriptQuery.data?.sents ?? [];

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-surface-elevated text-content flex w-[min(42rem,calc(100%-2rem))] max-w-none flex-col gap-0 overflow-hidden p-0">
        <AlertDialogHeader className="sr-only">
          <AlertDialogTitle>{voice?.name ?? t("library.voiceTranscript.title")}</AlertDialogTitle>
          <AlertDialogDescription>{t("library.voiceTranscript.title")}</AlertDialogDescription>
        </AlertDialogHeader>

        <VoiceTranscriptPanel
          isError={transcriptQuery.isError}
          isLoading={transcriptQuery.isLoading}
          sentences={sentences}
          variant="dialog"
          voice={voice}
        />

        <AlertDialogFooter className="border-border border-t p-4">
          <AlertDialogCancel className="bg-content/5 text-content hover:bg-content/10 hover:text-content">
            {t("common.action.cancel")}
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
