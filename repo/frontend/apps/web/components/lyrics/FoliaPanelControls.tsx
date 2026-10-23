"use client";

import {
  Loader2,
  Repeat,
  Repeat1,
  RepeatOff,
  Shuffle,
  SlidersHorizontal,
  Trash2,
  Volume1,
  Volume2,
  VolumeX,
} from "lucide-react";
import {
  FoliaGroupLine,
  FoliaIconButton,
  FoliaQuickTile,
  FoliaSlider,
} from "@scopify/ui/scopify/components/folia-panel/controls";

import { FoliaPanelAppearance } from "@/components/lyrics/FoliaPanelAppearance";
import { FoliaPanelTheme } from "@/components/lyrics/FoliaPanelTheme";
import { useFoliaPanelControls } from "@/hooks/player/useFoliaPanelControls";
import { useAudioEqualizerStore } from "@/store/module/audioEqualizer";
import { useI18n } from "@/store/module/i18n";
import type { FoliaPanelControlsProps } from "@/types/components/lyrics";

// The controls tab (Folia panelTab/ControlsTab.tsx): three groups — sound (volume and three
// tiles), appearance (lyric style and background) and theme. Folia's middle tile is automix, which
// Scopify's player does not have; it holds shuffle here (or the personal FM's dislike).

export function FoliaPanelControls({
  onOpenEqualizer,
  onOpenSettings,
  onOpenThemeLibrary,
  theme,
}: FoliaPanelControlsProps) {
  const { t } = useI18n();
  const model = useFoliaPanelControls();
  const isEqualizerOn = useAudioEqualizerStore((state) => state.settings.enabled);
  const volume = model.volume / 100;
  const percent = `${Math.round(model.volume)}%`;
  const LoopIcon =
    model.repeatMode === "off" ? RepeatOff : model.repeatMode === "one" ? Repeat1 : Repeat;
  const loopLabel = t(
    model.repeatMode === "off"
      ? "folia.panel.loopOff"
      : model.repeatMode === "one"
        ? "folia.panel.loopOne"
        : "folia.panel.loopAll",
  );

  return (
    <div>
      <div className="flex h-10 items-center gap-2">
        <FoliaIconButton label={t("folia.ui.mute")} onClick={model.toggleMute}>
          {volume === 0 ? (
            <VolumeX size={17} />
          ) : volume < 0.5 ? (
            <Volume1 size={17} />
          ) : (
            <Volume2 size={17} />
          )}
        </FoliaIconButton>
        <FoliaSlider
          value={volume}
          onPreview={(next) => model.setVolume(Math.round(next * 100))}
          onCommit={() => undefined}
          label={t("folia.ui.volume")}
          valueText={percent}
        />
        <span className="w-[38px] shrink-0 text-right text-xs text-[color:var(--st-t2)] tabular-nums">
          {percent}
        </span>
      </div>

      <div className="mt-2 grid grid-cols-3 gap-2">
        <FoliaQuickTile
          kind="toggle"
          icon={<LoopIcon size={18} />}
          iconKey={model.repeatMode}
          label={loopLabel}
          lit={model.repeatMode !== "off"}
          onClick={model.toggleRepeat}
        />
        {model.isPersonalFm ? (
          <FoliaQuickTile
            kind="toggle"
            icon={
              model.isDislikingPersonalFm ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Trash2 size={18} />
              )
            }
            label={t("personalFm.action.dislike")}
            lit={false}
            disabled={model.isDislikingPersonalFm}
            onClick={model.dislikePersonalFm}
          />
        ) : (
          <FoliaQuickTile
            kind="toggle"
            icon={<Shuffle size={18} />}
            label={t("folia.panel.shuffle")}
            lit={model.isShuffle}
            onClick={model.toggleShuffle}
          />
        )}
        <FoliaQuickTile
          kind="open"
          icon={<SlidersHorizontal size={18} />}
          label={t("folia.panel.equalizer")}
          lit={isEqualizerOn}
          onClick={onOpenEqualizer}
        />
      </div>

      <FoliaGroupLine />
      <FoliaPanelAppearance onOpenSettings={onOpenSettings} theme={theme} />
      <FoliaGroupLine />
      <FoliaPanelTheme onOpenThemeLibrary={onOpenThemeLibrary} />
    </div>
  );
}
