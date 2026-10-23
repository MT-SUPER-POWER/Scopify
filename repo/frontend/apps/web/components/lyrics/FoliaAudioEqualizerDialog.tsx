"use client";

import { AnimatePresence } from "framer-motion";
import { FoliaStudioWindow } from "@scopify/ui/scopify/components/folia-studio/window";
import { FoliaAudioEqualizerPanel } from "@/components/lyrics/FoliaAudioEqualizerPanel";
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
            <FoliaAudioEqualizerPanel theme={theme} />
          </div>
        </FoliaStudioWindow>
      ) : null}
    </AnimatePresence>
  );
}
