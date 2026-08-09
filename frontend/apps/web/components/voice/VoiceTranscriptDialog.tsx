"use client";

import Image from "next/image";
import { LoaderCircle, ScrollText } from "lucide-react";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useVoiceTranscriptQuery } from "@/hooks/voice/useVoiceTranscriptQuery";
import { formatDuration } from "@/lib/utils";
import { useI18n } from "@/store/module/i18n";
import type { Voice } from "@/types/search";

interface VoiceTranscriptDialogProps {
  onOpenChange: (open: boolean) => void;
  open: boolean;
  voice: Voice | null;
}

const FALLBACK_COVER =
  "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?q=80&w=160&auto=format&fit=crop";

export function VoiceTranscriptDialog({ onOpenChange, open, voice }: VoiceTranscriptDialogProps) {
  const { t } = useI18n();
  const transcriptQuery = useVoiceTranscriptQuery(voice?.id ?? null, open);
  const sentences = transcriptQuery.data?.sents ?? [];

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-surface-elevated text-content flex w-[min(42rem,calc(100%-2rem))] max-w-none flex-col gap-0 overflow-hidden p-0">
        <AlertDialogHeader className="border-border border-b p-6 text-left">
          <div className="flex min-w-0 items-center gap-4">
            <Image
              width={64}
              height={64}
              src={voice?.coverUrl || FALLBACK_COVER}
              alt={voice?.name ?? ""}
              className="size-16 shrink-0 rounded-md object-cover"
            />
            <div className="min-w-0">
              <AlertDialogTitle className="text-content truncate text-xl">
                {voice?.name ?? t("library.voiceTranscript.title")}
              </AlertDialogTitle>
              <AlertDialogDescription className="text-content-muted mt-1 truncate">
                {[voice?.podcastName, voice?.hostName].filter(Boolean).join(" · ")}
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>

        <ScrollArea className="h-[min(55vh,40rem)] px-6">
          <div className="py-5">
            {transcriptQuery.isLoading ? (
              <div className="text-content-muted flex items-center justify-center gap-2 py-16 text-sm">
                <LoaderCircle className="size-4 animate-spin" />
                {t("library.voiceTranscript.loading")}
              </div>
            ) : transcriptQuery.isError ? (
              <div className="text-content-muted flex items-center justify-center gap-2 py-16 text-sm">
                <ScrollText className="size-4" />
                {t("library.voiceTranscript.unavailable")}
              </div>
            ) : sentences.length === 0 ? (
              <div className="text-content-muted flex items-center justify-center gap-2 py-16 text-sm">
                <ScrollText className="size-4" />
                {t("library.voiceTranscript.empty")}
              </div>
            ) : (
              <ol className="space-y-3">
                {sentences.map((sentence) => (
                  <li
                    key={`${sentence.beg}-${sentence.end}`}
                    className="flex gap-4 text-sm leading-6"
                  >
                    <time className="text-content-subtle w-11 shrink-0 pt-0.5 text-right font-mono text-xs">
                      {formatDuration(sentence.beg)}
                    </time>
                    <p className="text-content">{sentence.name}</p>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </ScrollArea>

        <AlertDialogFooter className="border-border border-t p-4">
          <AlertDialogCancel className="bg-content/5 text-content hover:bg-content/10 hover:text-content">
            {t("common.action.cancel")}
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
