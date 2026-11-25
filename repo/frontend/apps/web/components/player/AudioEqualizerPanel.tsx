"use client";

import { Copy, Plus, RotateCcw, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { FoliaIconButton } from "@scopify/ui/scopify/components/folia-panel/controls";

import { AudioEqualizerBands } from "@/components/player/AudioEqualizerBands";
import { AudioEqualizerEffects } from "@/components/player/AudioEqualizerEffects";
import { AUDIO_EQUALIZER_PRESETS } from "@/constants/audioEqualizer";
import { useAudioEqualizerDraft } from "@/hooks/player/useAudioEqualizerDraft";
import { cn } from "@/lib/utils";
import { useAudioEqualizerStore } from "@/store/module/audioEqualizer";
import type { AudioEqualizerPresetId } from "@/types/audio/equalizer";

const PRESETS = Object.keys(AUDIO_EQUALIZER_PRESETS) as AudioEqualizerPresetId[];

export function AudioEqualizerPanel() {
  const { t } = useTranslation();
  const { commit, draft, resetBands, resetEffects, updateBand, updateEffect } =
    useAudioEqualizerDraft();
  const applyPreset = useAudioEqualizerStore((state) => state.applyPreset);
  const createPreset = useAudioEqualizerStore((state) => state.createCustomPreset);
  const deletePreset = useAudioEqualizerStore((state) => state.deleteCustomPreset);
  const duplicatePreset = useAudioEqualizerStore((state) => state.duplicateCustomPreset);
  const renamePreset = useAudioEqualizerStore((state) => state.renameCustomPreset);

  const activePreset = draft.customPresets.find((preset) => preset.id === draft.preset);
  const presets = [
    ...PRESETS.map((id) => ({ id, name: t(`audioEqualizer.preset.${id}`) })),
    ...draft.customPresets,
  ];

  return (
    <div className="flex min-h-full flex-col">
      <div className="flex items-start gap-2">
        <div
          className="flex flex-1 flex-wrap gap-1.5"
          role="group"
          aria-label={t("audioEqualizer.presetLabel")}
        >
          {presets.map(({ id, name }) => (
            <button
              key={id}
              type="button"
              aria-pressed={draft.preset === id}
              onClick={() => applyPreset(id)}
              className={`st-t-fast h-7 max-w-full truncate rounded-lg px-3 text-[13px] whitespace-nowrap transition-[background-color,color,scale] active:scale-[0.96] ${
                draft.preset === id
                  ? "bg-[var(--st-accent)] text-[color:var(--st-on-accent)]"
                  : "bg-[var(--st-fill)] text-[color:var(--st-t2)] hover:bg-[var(--st-fill2)] hover:text-[color:var(--st-t1)]"
              }`}
            >
              {name}
            </button>
          ))}
        </div>
        <FoliaIconButton
          label={t("audioEqualizer.createPreset")}
          onClick={() =>
            createPreset(
              t("audioEqualizer.newPresetName", { index: draft.customPresets.length + 1 }),
            )
          }
        >
          <Plus size={16} />
        </FoliaIconButton>
        <FoliaIconButton
          label={t("audioEqualizer.resetPreset")}
          disabled={!activePreset}
          onClick={() => {
            resetBands();
            resetEffects();
          }}
        >
          <RotateCcw size={16} />
        </FoliaIconButton>
      </div>
      {activePreset && (
        <div className="mt-2 flex items-center gap-2">
          <input
            key={`${activePreset.id}:${activePreset.name}`}
            aria-label={t("audioEqualizer.presetName")}
            defaultValue={activePreset.name}
            maxLength={40}
            onBlur={(event) => {
              const value = event.currentTarget.value.trim();
              if (value) renamePreset(activePreset.id, value);
              else event.currentTarget.value = activePreset.name;
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") event.currentTarget.blur();
            }}
            className="h-8 min-w-0 flex-1 rounded-lg bg-[var(--st-fill)] px-3 text-[13px]"
          />
          <FoliaIconButton
            label={t("audioEqualizer.duplicatePreset")}
            onClick={() => duplicatePreset(activePreset.id)}
          >
            <Copy size={16} />
          </FoliaIconButton>
          <FoliaIconButton
            label={t("audioEqualizer.deletePreset")}
            onClick={() => deletePreset(activePreset.id)}
          >
            <Trash2 size={16} />
          </FoliaIconButton>
        </div>
      )}
      <div
        className={cn(
          "st-t-move flex flex-1 flex-col transition-opacity",
          !draft.enabled && "opacity-40",
        )}
      >
        <AudioEqualizerBands gains={draft.gains} onBandChange={updateBand} onCommit={commit} />
        <AudioEqualizerEffects
          effects={draft.effects}
          onEffectChange={updateEffect}
          onCommit={commit}
        />
      </div>
    </div>
  );
}
