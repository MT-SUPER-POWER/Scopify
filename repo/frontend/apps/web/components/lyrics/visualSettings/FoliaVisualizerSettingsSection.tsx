"use client";

import type { FoliaVisualSettingsSectionProps } from "@/types/lyrics/folia/visualSettings";
import { FoliaSettingsGroup } from "@scopify/ui/scopify/components/folia-studio/settings";
import { LyricRenderQualityRows } from "@/components/lyrics/folia/src/components/visualizer/renderQuality/LyricRenderQualityRows";
import { DEFAULT_LYRIC_RENDER_OVERRIDE } from "@/components/lyrics/folia/src/utils/lyricRenderQuality";
import { FoliaPartitaSettingsSection } from "@/components/lyrics/visualSettings/FoliaPartitaSettingsSection";
import { FoliaRandomSettingsSection } from "@/components/lyrics/visualSettings/FoliaRandomSettingsSection";
import { useLyricStageStore } from "@/store/module/lyrics";

const SHARED_QUALITY_MODES = ["cadenza", "fume", "diorama", "hanabi", "sonnet", "tempera"] as const;

export function FoliaVisualizerSettingsSection({ model: m }: FoliaVisualSettingsSectionProps) {
  const random = useLyricStageStore((state) => state.randomVisualizerMode);
  const qualityMode = SHARED_QUALITY_MODES.find((mode) => mode === m.visualizerMode);
  const scaleOnly = qualityMode === "cadenza" || qualityMode === "fume";
  const render = useLyricStageStore((state) =>
    qualityMode ? state.tunings[qualityMode]?.render : undefined,
  );
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
      }) ??
        (!qualityMode && (
          <p className="text-sm text-[color:var(--st-t2)]">{m.visualizerEntry.labelFallback}</p>
        ))}
      {qualityMode && (
        <FoliaSettingsGroup title={m.t("folia.options.lyricRenderSection")}>
          <LyricRenderQualityRows
            value={render ?? DEFAULT_LYRIC_RENDER_OVERRIDE}
            antialias={!scaleOnly}
            onChange={(patch) => {
              const { tunings, patchTuning } = useLyricStageStore.getState();
              patchTuning(qualityMode, {
                render: {
                  ...DEFAULT_LYRIC_RENDER_OVERRIDE,
                  ...tunings[qualityMode]?.render,
                  ...patch,
                },
              });
            }}
          />
        </FoliaSettingsGroup>
      )}
    </div>
  );
}
