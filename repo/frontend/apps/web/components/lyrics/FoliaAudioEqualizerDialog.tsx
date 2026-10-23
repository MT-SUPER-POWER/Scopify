"use client";

import { AnimatePresence } from "framer-motion";
import { FoliaStudioWindow } from "@scopify/ui/scopify/components/folia-studio/window";
import { AudioEqualizerPanel } from "@/components/player/AudioEqualizerPanel";
import { useFoliaModalFocus } from "@/hooks/lyrics/useFoliaModalFocus";
import { useI18n } from "@/store/module/i18n";
import type { FoliaAudioEqualizerDialogProps } from "@/types/components/lyrics";

export function FoliaAudioEqualizerDialog({
  isOpen,
  onClose,
  theme,
}: FoliaAudioEqualizerDialogProps) {
  const { t } = useI18n();
  const dialogRef = useFoliaModalFocus(isOpen, onClose);
  return (
    <AnimatePresence>
      {isOpen ? (
        <FoliaStudioWindow
          compact
          panelRef={dialogRef}
          layer={170}
          title={t("audioEqualizer.title")}
          backLabel={t("audioEqualizer.close")}
          onClose={onClose}
          isDaylight={theme.name === "snow"}
          colors={theme}
        >
          <div className="st-scroll min-h-0 overflow-y-auto px-5 pb-5">
            <AudioEqualizerPanel
              accentColor={theme.accentColor}
              style={{ color: theme.primaryColor }}
              selectContentClassName="[&_[data-slot=select-item][data-highlighted]]:bg-current/10 [&_[data-slot=select-label]]:text-current/55"
              selectContentStyle={{
                backgroundColor: `color-mix(in srgb, ${theme.backgroundColor} 94%, ${theme.primaryColor} 6%)`,
                borderColor: `color-mix(in srgb, ${theme.secondaryColor} 22%, transparent)`,
                color: theme.primaryColor,
                zIndex: 240,
              }}
            />
          </div>
        </FoliaStudioWindow>
      ) : null}
    </AnimatePresence>
  );
}
