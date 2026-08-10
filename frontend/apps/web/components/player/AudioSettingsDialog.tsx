"use client";

import { AudioLines, SlidersHorizontal, Waves, X } from "lucide-react";

import { AudioEqualizerPanel } from "@/components/player/AudioEqualizerPanel";
import { AudioQualityDialog } from "@/components/player/AudioQualityDialog";
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
import { cn } from "@/lib/utils";
import { useAudioEqualizerStore } from "@/store/module/audioEqualizer";
import { useI18n } from "@/store/module/i18n";

export function AudioSettingsDialog() {
  const { t } = useI18n();
  const isOpen = useAudioEqualizerStore((state) => state.isDialogOpen);
  const activeTab = useAudioEqualizerStore((state) => state.dialogTab);
  const closeDialog = useAudioEqualizerStore((state) => state.closeDialog);
  const setActiveTab = useAudioEqualizerStore((state) => state.setDialogTab);

  return (
    <AlertDialog
      open={isOpen}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) closeDialog();
      }}
    >
      <AlertDialogContent
        overlayClassName="z-110"
        overlayProps={{ onClick: closeDialog }}
        className="border-border bg-surface-overlay text-content z-110 max-h-[calc(100dvh-2rem)] grid-rows-[auto_auto_minmax(0,1fr)_auto] gap-4 overflow-hidden p-4 sm:p-6 data-[size=default]:sm:max-w-3xl"
      >
        <AlertDialogCancel
          aria-label={t("audioSettings.close")}
          className="absolute top-4 right-4 size-8 rounded-full p-0"
          size="icon"
          variant="ghost"
        >
          <X className="size-4" />
        </AlertDialogCancel>

        <AlertDialogHeader className="place-items-start pr-10 text-left">
          <AlertDialogTitle className="flex items-center gap-2 text-xl">
            <AudioLines className="text-brand size-5" />
            {t("audioSettings.title")}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-content-muted">
            {t("audioSettings.description")}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="bg-brand/5 grid grid-cols-2 rounded-xl p-1" role="tablist">
          <AudioSettingsTabButton
            active={activeTab === "quality"}
            icon={<Waves className="size-4" />}
            label={t("audioSettings.qualityTab")}
            onClick={() => setActiveTab("quality")}
          />
          <AudioSettingsTabButton
            active={activeTab === "equalizer"}
            icon={<SlidersHorizontal className="size-4" />}
            label={t("audioSettings.equalizerTab")}
            onClick={() => setActiveTab("equalizer")}
          />
        </div>

        <ScrollArea className="max-h-[calc(100dvh-15rem)] min-h-0" viewportClassName="pr-3">
          <div className="min-w-0" role="tabpanel">
            {activeTab === "quality" ? <AudioQualityDialog /> : <AudioEqualizerPanel />}
          </div>
        </ScrollArea>

        <AlertDialogFooter>
          <AlertDialogCancel>{t("audioSettings.close")}</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function AudioSettingsTabButton({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick(): void;
}) {
  return (
    <button
      type="button"
      aria-selected={active}
      className={cn(
        "flex h-9 items-center justify-center gap-2 rounded-lg text-xs font-semibold transition-colors",
        active ? "bg-brand/15 text-brand" : "text-content-muted hover:bg-brand/10 hover:text-brand",
      )}
      onClick={onClick}
      role="tab"
    >
      {icon}
      {label}
    </button>
  );
}
