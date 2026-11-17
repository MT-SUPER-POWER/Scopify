"use client";

import type { FoliaVisualSettingsSectionProps } from "@/types/lyrics/folia/visualSettings";
import { FoliaSettingsGroup } from "@scopify/ui/scopify/components/folia-studio/settings";
import { LyricRenderQualityRows } from "@/components/lyrics/folia/src/components/visualizer/renderQuality/LyricRenderQualityRows";
import { DEFAULT_LYRIC_RENDER_OVERRIDE } from "@/components/lyrics/folia/src/utils/lyricRenderQuality";
import { FoliaPartitaSettingsSection } from "@/components/lyrics/visualSettings/FoliaPartitaSettingsSection";
import { FoliaRandomSettingsSection } from "@/components/lyrics/visualSettings/FoliaRandomSettingsSection";
import { useLyricStageStore } from "@/store/module/lyrics";

export function FoliaVisualizerSettingsSection({ model: m }: FoliaVisualSettingsSectionProps) {
  const random = useLyricStageStore((state) => state.randomVisualizerMode);
  const mode = m.visualizerMode;
  const scaleOnly = mode === "cadenza" || mode === "fume";
  const hasSharedQualityPanel =
    scaleOnly || mode === "diorama" || mode === "hanabi" || mode === "sonnet" || mode === "tempera";
  const render = useLyricStageStore((state) =>
    hasSharedQualityPanel ? state.tunings[mode]?.render : undefined,
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
        (!hasSharedQualityPanel && (
          <p className="text-sm text-[color:var(--st-t2)]">{m.visualizerEntry.labelFallback}</p>
        ))}
      {hasSharedQualityPanel && (
        <FoliaSettingsGroup title={m.t("folia.options.lyricRenderSection")}>
          <LyricRenderQualityRows
            value={render ?? DEFAULT_LYRIC_RENDER_OVERRIDE}
            antialias={!scaleOnly}
            onChange={(patch) => {
              const { tunings, patchTuning } = useLyricStageStore.getState();
              patchTuning(mode, {
                render: { ...DEFAULT_LYRIC_RENDER_OVERRIDE, ...tunings[mode]?.render, ...patch },
              });
            }}
          />
        </FoliaSettingsGroup>
      )}
    </div>
  );
}
