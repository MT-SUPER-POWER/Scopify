"use client";

import type { FoliaVisualSettingsSectionProps } from "@/types/foliaVisualSettings";
import { FoliaPartitaSettingsSection } from "@/components/lyrics/FoliaPartitaSettingsSection";
import { FoliaRandomSettingsSection } from "@/components/lyrics/FoliaRandomSettingsSection";
import { useLyricStageStore } from "@/store/module/lyrics";

export function FoliaVisualizerSettingsSection({ model: m }: FoliaVisualSettingsSectionProps) {
  const random = useLyricStageStore((state) => state.randomVisualizerMode);
  if (random) return <FoliaRandomSettingsSection />;
  if (m.visualizerMode === "partita") return <FoliaPartitaSettingsSection model={m} />;
  return (
    <div className="folia-studio-tuning space-y-6">
      {m.visualizerEntry.renderSettingsPanel?.({
        ...m,
        cappellaCustomEmojiCount: m.cappellaCustomEmojiImages.length,
        hasCappellaCustomEmojiPack: m.cappellaCustomEmojiImages.length > 0,
        isCappellaCustomEmojiPackLoading: m.isLoadingCappellaCustomEmojiPack,
        hasCappellaCustomAvatar: m.cappellaCustomAvatarImages.length > 0,
        isCappellaCustomAvatarLoading: m.isLoadingCappellaCustomAvatarPack,
      }) ?? <p className="text-sm text-[color:var(--st-t2)]">{m.visualizerEntry.labelFallback}</p>}
    </div>
  );
}
