"use client";

import { AudioLines, SlidersHorizontal, Waves, X } from "lucide-react";

import { AudioEqualizerPanel } from "@/components/player/AudioEqualizerPanel";
import { AudioQualityDialog } from "@/components/player/AudioQualityDialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useAudioEqualizerStore } from "@/store/module/audioEqualizer";
import { useI18n } from "@/store/module/i18n";

interface AudioSettingsDialogProps {
  children: React.ReactNode;
}

export function AudioSettingsDialog({ children }: AudioSettingsDialogProps) {
  const { t } = useI18n();
  const isOpen = useAudioEqualizerStore((state) => state.isDialogOpen);
  const activeTab = useAudioEqualizerStore((state) => state.dialogTab);
  const closeDialog = useAudioEqualizerStore((state) => state.closeDialog);
  const openDialog = useAudioEqualizerStore((state) => state.openDialog);
  const setActiveTab = useAudioEqualizerStore((state) => state.setDialogTab);

  return (
    <Popover
      open={isOpen}
      onOpenChange={(nextOpen) => {
        if (nextOpen) openDialog("quality");
        else closeDialog();
      }}
    >
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        align="end"
        side="top"
        sideOffset={10}
        className="w-md max-w-[calc(100vw-2rem)] overflow-hidden border bg-popover p-0 text-popover-foreground shadow-floating"
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b bg-popover/95 px-4 py-3 backdrop-blur-sm">
          <div>
            <h3 className="flex items-center gap-2 text-base font-semibold">
              <AudioLines className="size-4" />
              {t("audioSettings.title")}
            </h3>
          </div>
          <button
            type="button"
            aria-label={t("audioSettings.close")}
            className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            onClick={closeDialog}
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Tab switcher — segment control style */}
        <div className="mx-4 mt-3 grid grid-cols-2 rounded-lg bg-muted/60 p-0.5" role="tablist">
          <AudioSettingsTabButton
            active={activeTab === "quality"}
            icon={<Waves className="size-3.5" />}
            label={t("audioSettings.qualityTab")}
            onClick={() => setActiveTab("quality")}
          />
          <AudioSettingsTabButton
            active={activeTab === "equalizer"}
            icon={<SlidersHorizontal className="size-3.5" />}
            label={t("audioSettings.equalizerTab")}
            onClick={() => setActiveTab("equalizer")}
          />
        </div>

        <ScrollArea className="max-h-[min(80vh,34rem)] px-4 py-3" viewportClassName="pr-1">
          <div className="min-w-0" role="tabpanel">
            {activeTab === "quality" ? <AudioQualityDialog /> : <AudioEqualizerPanel />}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
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
        "flex h-8 items-center justify-center gap-1.5 rounded-md text-xs font-medium transition-all",
        active
          ? "bg-popover text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground",
      )}
      onClick={onClick}
      role="tab"
    >
      {icon}
      {label}
    </button>
  );
}
