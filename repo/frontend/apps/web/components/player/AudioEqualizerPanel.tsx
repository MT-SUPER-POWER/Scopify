"use client";

import { Copy, Plus, Power, Trash2, Waves } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AUDIO_EQUALIZER_BANDS,
  AUDIO_EQUALIZER_MAX_GAIN_DB,
  AUDIO_EQUALIZER_MIN_GAIN_DB,
  AUDIO_EFFECT_CONTROLS,
} from "@/constants/audioEqualizer";
import { cn } from "@/lib/utils";
import { useAudioEqualizerStore } from "@/store/module/audioEqualizer";
import { useI18n } from "@/store/module/i18n";
import type {
  AudioEffectControl,
  AudioEffectId,
  AudioEqualizerModeId,
  AudioEqualizerPresetId,
  AudioEqualizerSettings,
  AudioEqualizerUserPresetId,
} from "@/types/audioEqualizer";

const toSliderPosition = (control: AudioEffectControl, value: number) => {
  if (control.scale === "log") {
    const min = Math.log(control.min);
    return Math.round(((Math.log(value) - min) / (Math.log(control.max) - min)) * 1000);
  }
  return Math.round(((value - control.min) / (control.max - control.min)) * 1000);
};

const fromSliderPosition = (control: AudioEffectControl, position: number) => {
  const ratio = Math.min(1, Math.max(0, position / 1000));
  if (control.scale === "log") {
    return Math.round(
      Math.exp(Math.log(control.min) + ratio * (Math.log(control.max) - Math.log(control.min))),
    );
  }
  const value = control.min + ratio * (control.max - control.min);
  return Number((Math.round(value / control.step) * control.step).toFixed(4));
};

const formatEffectValue = (control: AudioEffectControl, value: number) =>
  control.unit === "hz"
    ? value >= 1000
      ? `${(value / 1000).toFixed(1)} kHz`
      : `${Math.round(value)} Hz`
    : `${Math.round(value * 100)}%`;

const PRESET_IDS: AudioEqualizerPresetId[] = ["flat", "lofi", "radio", "vinyl", "vocal", "bass"];
const isUserPresetId = (value: AudioEqualizerModeId): value is AudioEqualizerUserPresetId =>
  value.startsWith("user:");

export function AudioEqualizerPanel() {
  const { t } = useI18n();
  const settings = useAudioEqualizerStore((state) => state.settings);
  const [draft, setDraft] = useState<AudioEqualizerSettings>(settings);
  const [nameDraft, setNameDraft] = useState("");
  const draftRef = useRef(draft);
  const applyPreset = useAudioEqualizerStore((state) => state.applyPreset);
  const setEnabled = useAudioEqualizerStore((state) => state.setEnabled);
  const commitSettings = useAudioEqualizerStore((state) => state.commitSettings);
  const createCustomPreset = useAudioEqualizerStore((state) => state.createCustomPreset);
  const deleteCustomPreset = useAudioEqualizerStore((state) => state.deleteCustomPreset);
  const duplicateCustomPreset = useAudioEqualizerStore((state) => state.duplicateCustomPreset);
  const renameCustomPreset = useAudioEqualizerStore((state) => state.renameCustomPreset);
  const activeCustomPreset = isUserPresetId(draft.preset)
    ? (draft.customPresets.find((preset) => preset.id === draft.preset) ?? null)
    : null;
  const headroomDb = draft.enabled ? Math.max(0, ...draft.gains) : 0;

  useEffect(() => {
    draftRef.current = settings;
    setDraft(settings);
  }, [settings]);

  useEffect(() => {
    setNameDraft(activeCustomPreset?.name ?? "");
  }, [activeCustomPreset?.id, activeCustomPreset?.name]);

  const updateDraft = (next: AudioEqualizerSettings) => {
    draftRef.current = next;
    setDraft(next);
    commitSettings(next);
  };
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
    updateDraft({
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
    });
  };
  const updateBandDraft = (index: number, gain: number) => {
    const gains = [...draftRef.current.gains];
    gains[index] = gain;
    writeCustomDraft(gains, { ...draftRef.current.effects });
  };
  const updateEffectDraft = (id: AudioEffectId, value: number) =>
    writeCustomDraft([...draftRef.current.gains], {
      ...draftRef.current.effects,
      [id]: value,
    });
  const commitDraft = () => commitSettings(draftRef.current);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-muted/20 p-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          aria-pressed={draft.enabled}
          onClick={() => setEnabled(!draft.enabled)}
          className={cn(
            "flex h-9 items-center gap-2 rounded-xl border border-current/10 bg-current/[0.035] px-3 text-xs font-semibold transition-all hover:bg-current/[0.07]",
            draft.enabled && "border-primary/40 text-primary shadow-sm",
          )}
        >
          <Power className="size-3" />
          {t(draft.enabled ? "audioEqualizer.enabled" : "audioEqualizer.disabled")}
        </button>

        <div className="flex min-w-0 items-center gap-2">
          <span className="hidden text-[10px] font-semibold tracking-[0.16em] uppercase opacity-45 sm:inline">
            {t("audioEqualizer.presetLabel")}
          </span>
          <Select
            value={draft.preset}
            onValueChange={(val) => applyPreset(val as AudioEqualizerModeId)}
          >
            <SelectTrigger className="h-9 min-w-0 flex-1 rounded-xl border-current/10 bg-current/[0.035] text-xs font-semibold sm:w-[166px] sm:flex-none">
              <SelectValue placeholder={t("audioEqualizer.presetLabel")} />
            </SelectTrigger>
            <SelectContent position="popper" sideOffset={6} style={{ zIndex: 2100 }}>
              <SelectGroup>
                <SelectLabel>{t("audioEqualizer.builtinPresets")}</SelectLabel>
                {PRESET_IDS.map((preset) => (
                  <SelectItem key={preset} value={preset} className="text-xs">
                    {t(`audioEqualizer.preset.${preset}`)}
                  </SelectItem>
                ))}
              </SelectGroup>
              {draft.customPresets.length > 0 ? (
                <>
                  <SelectSeparator />
                  <SelectGroup>
                    <SelectLabel>{t("audioEqualizer.myPresets")}</SelectLabel>
                    {draft.customPresets.map((preset) => (
                      <SelectItem key={preset.id} value={preset.id} className="text-xs">
                        {preset.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </>
              ) : null}
            </SelectContent>
          </Select>
          <button
            aria-label={t("audioEqualizer.createPreset")}
            className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-current/10 bg-current/[0.035] transition-colors hover:bg-current/[0.08]"
            onClick={() =>
              createCustomPreset(
                t("audioEqualizer.newPresetName", { index: draft.customPresets.length + 1 }),
              )
            }
            title={t("audioEqualizer.createPreset")}
            type="button"
          >
            <Plus className="size-3.5" />
          </button>
        </div>
      </div>

      {activeCustomPreset ? (
        <div className="flex flex-col gap-3 rounded-2xl border border-border bg-muted/20 px-3 py-2.5 sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1">
            <div className="mb-1 text-[9px] font-semibold tracking-[0.16em] uppercase opacity-40">
              {t("audioEqualizer.presetName")}
            </div>
            <input
              className="w-full bg-transparent text-sm font-semibold outline-none"
              maxLength={40}
              onBlur={() => renameCustomPreset(activeCustomPreset.id, nameDraft)}
              onChange={(event) => setNameDraft(event.currentTarget.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") event.currentTarget.blur();
              }}
              value={nameDraft}
            />
          </div>
          <div className="flex shrink-0 gap-1.5">
            <button
              className="flex size-9 items-center justify-center rounded-xl border border-current/10 transition-colors hover:bg-current/[0.07]"
              onClick={() => duplicateCustomPreset(activeCustomPreset.id)}
              title={t("audioEqualizer.duplicatePreset")}
              type="button"
            >
              <Copy size={14} />
            </button>
            <button
              className="flex size-9 items-center justify-center rounded-xl border border-destructive/40 text-destructive transition-colors hover:bg-destructive/10"
              onClick={() => deleteCustomPreset(activeCustomPreset.id)}
              title={t("audioEqualizer.deletePreset")}
              type="button"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      ) : null}

      {/* EQ bands */}
      <div className="rounded-2xl border border-border bg-muted/20 p-4">
        <div className="mb-3 flex items-center justify-between text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
          <span>{t("audioEqualizer.bandGain")}</span>
          <span>
            {t("folia.audioEqualizer.autoHeadroom")} −{headroomDb} dB · +12 / −12 dB
          </span>
        </div>
        <div className="flex justify-between">
          {AUDIO_EQUALIZER_BANDS.map((band, index) => {
            const gain = draft.gains[index] ?? 0;
            return (
              <label key={band.frequency} className="flex flex-col items-center gap-1.5">
                <span
                  className={cn(
                    "text-[10px] font-semibold text-muted-foreground tabular-nums",
                    gain !== 0 && "text-primary",
                  )}
                >
                  {gain > 0 ? "+" : ""}
                  {gain}
                </span>
                <input
                  type="range"
                  min={AUDIO_EQUALIZER_MIN_GAIN_DB}
                  max={AUDIO_EQUALIZER_MAX_GAIN_DB}
                  step={1}
                  value={gain}
                  aria-label={`${band.label} Hz`}
                  onChange={(event) => updateBandDraft(index, Number(event.currentTarget.value))}
                  onInput={(event) => updateBandDraft(index, Number(event.currentTarget.value))}
                  onPointerUp={commitDraft}
                  onPointerCancel={commitDraft}
                  onKeyUp={commitDraft}
                  onBlur={commitDraft}
                  className="h-24 w-1.5 cursor-pointer appearance-none rounded-full bg-border accent-primary"
                  style={{ direction: "rtl", writingMode: "vertical-lr" }}
                />
                <span className="text-[10px] font-semibold text-muted-foreground tabular-nums">
                  {band.label}
                </span>
              </label>
            );
          })}
        </div>
        <div className="mt-2 text-center text-[9px] tracking-widest text-muted-foreground uppercase">
          Hz
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-muted/20 p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-[10px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
          <span className="flex items-center gap-1.5">
            <Waves size={13} />
            {t("audioEqualizer.effects")}
          </span>
          <span className="tracking-normal normal-case">{t("audioEqualizer.effectsHint")}</span>
        </div>
        <div className="grid gap-x-5 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
          {AUDIO_EFFECT_CONTROLS.map((control) => {
            const value = draft.effects[control.id];
            return (
              <label key={control.id} className="flex flex-col gap-1">
                <span className="flex items-baseline justify-between gap-2">
                  <span className="text-[11px] font-semibold text-muted-foreground">
                    {t(`audioEqualizer.effect.${control.id}`)}
                  </span>
                  <span
                    className={cn(
                      "text-[10px] font-semibold text-muted-foreground tabular-nums",
                      value !== control.neutral && "text-primary",
                    )}
                  >
                    {formatEffectValue(control, value)}
                  </span>
                </span>
                <input
                  aria-label={t(`audioEqualizer.effect.${control.id}`)}
                  className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-border accent-primary"
                  max={1000}
                  min={0}
                  onChange={(event) =>
                    updateEffectDraft(
                      control.id,
                      fromSliderPosition(control, Number(event.currentTarget.value)),
                    )
                  }
                  onInput={(event) =>
                    updateEffectDraft(
                      control.id,
                      fromSliderPosition(control, Number(event.currentTarget.value)),
                    )
                  }
                  onPointerUp={commitDraft}
                  onPointerCancel={commitDraft}
                  onKeyUp={commitDraft}
                  onBlur={commitDraft}
                  step={1}
                  type="range"
                  value={toSliderPosition(control, value)}
                />
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
}
