"use client";

import Image from "next/image";
import { LoaderCircle, ScrollText } from "lucide-react";

import { ScrollArea } from "@/components/ui/scroll-area";
import { cn, formatDuration } from "@/lib/utils";
import { useI18n } from "@/store/module/i18n";
import type { VoiceLyricSentence } from "@/types/api/voicelist";
import type { Voice } from "@/types/search";

interface VoiceTranscriptPanelProps {
  isError: boolean;
  isLoading: boolean;
  sentences: VoiceLyricSentence[];
  voice: Voice | null;
  variant?: "compact" | "dialog";
}

const FALLBACK_COVER =
  "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?q=80&w=160&auto=format&fit=crop";

export function VoiceTranscriptPanel({
  isError,
  isLoading,
  sentences,
  voice,
  variant = "compact",
}: VoiceTranscriptPanelProps) {
  const { t } = useI18n();
  const isDialog = variant === "dialog";

  return (
    <div className="min-w-0">
      <div
        className={cn(
          "flex min-w-0 border-b border-border",
          isDialog
            ? "items-center gap-4 p-6"
            : "sticky top-0 z-10 items-center gap-3 bg-surface-elevated/90 px-4 py-3 backdrop-blur-sm",
        )}
      >
        <Image
          width={isDialog ? 64 : 44}
          height={isDialog ? 64 : 44}
          src={voice?.coverUrl || FALLBACK_COVER}
          alt={voice?.name ?? ""}
          className={cn("shrink-0 rounded-md object-cover", isDialog ? "size-16" : "size-11")}
        />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-content">
            {voice?.name ?? t("library.voiceTranscript.title")}
          </p>
          <p className="mt-0.5 truncate text-xs text-content-muted">
            {[voice?.podcastName, voice?.hostName].filter(Boolean).join(" · ")}
          </p>
        </div>
      </div>

      <ScrollArea className={isDialog ? "h-[min(55vh,40rem)] px-6" : "h-[min(52vh,30rem)] px-4"}>
        <div className={isDialog ? "py-5" : "py-4"}>
          {isLoading ? (
            <div
              className={cn(
                "flex items-center justify-center gap-2 text-sm text-content-muted",
                isDialog ? "py-16" : "py-12",
              )}
            >
              <LoaderCircle className="size-4 animate-spin" />
              {t("library.voiceTranscript.loading")}
            </div>
          ) : isError ? (
            <div
              className={cn(
                "flex items-center justify-center gap-2 text-sm text-content-muted",
                isDialog ? "py-16" : "py-12",
              )}
            >
              <ScrollText className="size-4" />
              {t("library.voiceTranscript.unavailable")}
            </div>
          ) : sentences.length === 0 ? (
            <div
              className={cn(
                "flex items-center justify-center gap-2 text-sm text-content-muted",
                isDialog ? "py-16" : "py-12",
              )}
            >
              <ScrollText className="size-4" />
              {t("library.voiceTranscript.empty")}
            </div>
          ) : (
            <ol className="space-y-3">
              {sentences.map((sentence) => (
                <li
                  key={`${sentence.beg}-${sentence.end}`}
                  className={cn("flex text-sm leading-6", isDialog ? "gap-4" : "gap-3")}
                >
                  <time
                    className={cn(
                      "w-11 shrink-0 pt-0.5 text-right font-mono text-content-subtle",
                      isDialog ? "text-xs" : "text-[11px]",
                    )}
                  >
                    {formatDuration(sentence.beg)}
                  </time>
                  <p className="min-w-0 text-content">{sentence.name}</p>
                </li>
              ))}
            </ol>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
