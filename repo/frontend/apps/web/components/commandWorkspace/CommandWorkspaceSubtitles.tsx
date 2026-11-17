"use client";

import { X } from "lucide-react";
import type { CSSProperties } from "react";
import { useTranslation } from "react-i18next";
import { FoliaSubtitleOverlaySettings } from "@/components/lyrics/visualSettings/FoliaSubtitleOverlaySettings";
import { useFoliaSettingsStore } from "@/store/module/foliaSettings";
import type { CommandWorkspaceNowPlayingProps } from "@/types/commandWorkspace/model";

const studioSettingsColors = {
  "--st-card": "var(--surface)",
  "--st-fill": "var(--surface-elevated)",
  "--st-line": "var(--border)",
  "--st-t2": "var(--content-muted)",
  "--text-accent": "var(--primary)",
} as CSSProperties;

export function CommandWorkspaceSubtitles({ onClose }: CommandWorkspaceNowPlayingProps) {
  const { t } = useTranslation();
  return (
    <div className="space-y-3 p-4 text-content" style={studioSettingsColors}>
      <header className="flex justify-end">
        <button
          type="button"
          autoFocus
          title={t("folia.ui.close")}
          aria-label={t("folia.ui.close")}
          onClick={onClose}
          className="rounded p-1 text-content-muted hover:bg-content/10 hover:text-content"
        >
          <X className="size-4" />
        </button>
      </header>
      <div className="scrollbar-thin max-h-[min(53vh,32rem)] overflow-y-auto">
        <FoliaSubtitleOverlaySettings />
      </div>
      <button
        type="button"
        onClick={() => {
          onClose?.();
          useFoliaSettingsStore.getState().openVisualSettings("subtitle");
        }}
        className="rounded-md px-3 py-2 text-sm text-content-muted hover:bg-content/10 hover:text-content"
      >
        {t("folia.ui.moreSettings")}
      </button>
    </div>
  );
}
