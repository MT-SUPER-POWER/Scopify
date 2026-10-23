"use client";

import { useEffect, useRef, useState } from "react";

import { AUDIO_EQUALIZER_PRESETS, DEFAULT_AUDIO_EFFECT_SETTINGS } from "@/constants/audioEqualizer";
import { useAudioEqualizerStore } from "@/store/module/audioEqualizer";
import { useI18n } from "@/store/module/i18n";
import type {
  AudioEffectId,
  AudioEqualizerModeId,
  AudioEqualizerPresetId,
  AudioEqualizerSettings,
  AudioEqualizerUserPresetId,
} from "@/types/audioEqualizer";

export const isUserPresetId = (value: AudioEqualizerModeId): value is AudioEqualizerUserPresetId =>
  value.startsWith("user:");

/**
 * A local draft of the equalizer settings that follows the store. Editing a built-in preset forks
 * it into a user preset first, so built-ins never change under the user.
 */
export function useAudioEqualizerDraft() {
  const { t } = useI18n();
  const settings = useAudioEqualizerStore((state) => state.settings);
  const commitSettings = useAudioEqualizerStore((state) => state.commitSettings);
  const createCustomPreset = useAudioEqualizerStore((state) => state.createCustomPreset);
  const [draft, setDraft] = useState<AudioEqualizerSettings>(settings);
  const draftRef = useRef(draft);

  useEffect(() => {
    draftRef.current = settings;
    setDraft(settings);
  }, [settings]);

  const writeCustomDraft = (gains: number[], effects: AudioEqualizerSettings["effects"]) => {
    if (!isUserPresetId(draftRef.current.preset)) {
      const sourceName = t(
        `audioEqualizer.preset.${draftRef.current.preset as AudioEqualizerPresetId}`,
      );
      createCustomPreset(t("audioEqualizer.copyName", { name: sourceName }));
      const created = useAudioEqualizerStore.getState().settings;
      draftRef.current = created;
      setDraft(created);
    }
    const userPresetId = draftRef.current.preset as AudioEqualizerUserPresetId;
    const next: AudioEqualizerSettings = {
      ...draftRef.current,
      customGains: [...gains],
      customPresets: draftRef.current.customPresets.map((preset) =>
        preset.id === userPresetId
          ? { ...preset, gains: [...gains], effects: { ...effects }, updatedAt: Date.now() }
          : preset,
      ),
      effects,
      enabled: true,
      gains,
      preset: userPresetId,
    };
    draftRef.current = next;
    setDraft(next);
    commitSettings(next);
  };

  const updateBand = (index: number, gain: number) => {
    const gains = [...draftRef.current.gains];
    gains[index] = gain;
    writeCustomDraft(gains, { ...draftRef.current.effects });
  };
  const updateEffect = (id: AudioEffectId, value: number) =>
    writeCustomDraft([...draftRef.current.gains], { ...draftRef.current.effects, [id]: value });
  const resetBands = () =>
    writeCustomDraft([...AUDIO_EQUALIZER_PRESETS.flat], { ...draftRef.current.effects });
  const resetEffects = () =>
    writeCustomDraft([...draftRef.current.gains], { ...DEFAULT_AUDIO_EFFECT_SETTINGS });
  const commit = () => commitSettings(draftRef.current);

  return { commit, draft, resetBands, resetEffects, updateBand, updateEffect };
}
