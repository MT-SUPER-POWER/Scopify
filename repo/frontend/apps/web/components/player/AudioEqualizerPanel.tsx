"use client";

import { Copy, PencilLine, Plus, RotateCcw, Trash2 } from "lucide-react";
import { useEffect, useState, type CSSProperties } from "react";

import { AudioEffectSlider } from "@/components/player/AudioEffectSlider";
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
import { Switch } from "@/components/ui/switch";
import {
  AUDIO_EFFECT_CONTROL_MAP,
  AUDIO_EFFECT_CONTROLS,
  AUDIO_EFFECT_GROUPS,
  AUDIO_EQUALIZER_BANDS,
  AUDIO_EQUALIZER_MAX_GAIN_DB,
} from "@/constants/audioEqualizer";
import { EqualizerCurve } from "@scopify/ui/scopify/components/equalizer-curve";
import { isUserPresetId, useAudioEqualizerDraft } from "@/hooks/player/useAudioEqualizerDraft";
import { cn } from "@/lib/utils";
import { useAudioEqualizerStore } from "@/store/module/audioEqualizer";
import { useI18n } from "@/store/module/i18n";
import type { AudioEqualizerModeId, AudioEqualizerPresetId } from "@/types/audio/equalizer";
import type {
  AudioEqualizerPanelProps,
  AudioEqualizerPanelSectionProps,
} from "@/types/audio/equalizerPanelComponents";

const PRESET_IDS: AudioEqualizerPresetId[] = ["flat", "lofi", "radio", "vinyl", "vocal", "bass"];

const iconButtonClass =
  "flex size-8 shrink-0 items-center justify-center rounded-lg opacity-70 transition-[opacity,background-color] hover:bg-current/[0.07] hover:opacity-100 disabled:pointer-events-none disabled:opacity-30";

/** Shared by the player's audio popover and Folia's studio window; colours follow currentColor. */
export function AudioEqualizerPanel({
  accentColor,
  className,
  selectContentClassName,
  selectContentStyle,
  style,
}: AudioEqualizerPanelProps) {
  const { t } = useI18n();
  const { commit, draft, resetBands, resetEffects, updateBand, updateEffect } =
    useAudioEqualizerDraft();
  const [nameDraft, setNameDraft] = useState("");
  const applyPreset = useAudioEqualizerStore((state) => state.applyPreset);
  const setEnabled = useAudioEqualizerStore((state) => state.setEnabled);
  const createCustomPreset = useAudioEqualizerStore((state) => state.createCustomPreset);
  const deleteCustomPreset = useAudioEqualizerStore((state) => state.deleteCustomPreset);
  const duplicateCustomPreset = useAudioEqualizerStore((state) => state.duplicateCustomPreset);
  const renameCustomPreset = useAudioEqualizerStore((state) => state.renameCustomPreset);
  const activeCustomPreset = isUserPresetId(draft.preset)
    ? (draft.customPresets.find((preset) => preset.id === draft.preset) ?? null)
    : null;
  const headroomDb = draft.enabled ? Math.max(0, ...draft.gains) : 0;
  const hasBandGain = draft.gains.some((gain) => gain !== 0);
  const hasEffect = AUDIO_EFFECT_CONTROLS.some(
    (control) => draft.effects[control.id] !== control.neutral,
  );

  useEffect(() => {
    setNameDraft(activeCustomPreset?.name ?? "");
  }, [activeCustomPreset?.id, activeCustomPreset?.name]);

  return (
    <div
      className={cn("space-y-5", className)}
      style={{ "--eq-accent": accentColor ?? "var(--primary)", ...style } as CSSProperties}
    >
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Select
            value={draft.preset}
            onValueChange={(val) => applyPreset(val as AudioEqualizerModeId)}
          >
            <SelectTrigger
              aria-label={t("audioEqualizer.presetLabel")}
              className="h-9 min-w-0 flex-1 rounded-lg border-current/10 bg-current/[0.04] text-sm font-medium shadow-none"
            >
              <SelectValue placeholder={t("audioEqualizer.presetLabel")} />
            </SelectTrigger>
            <SelectContent
              className={selectContentClassName}
              position="popper"
              sideOffset={6}
              style={selectContentStyle}
            >
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
            className={cn(iconButtonClass, "size-9 border border-current/10 bg-current/[0.04]")}
            onClick={() =>
              createCustomPreset(
                t("audioEqualizer.newPresetName", { index: draft.customPresets.length + 1 }),
              )
            }
            title={t("audioEqualizer.createPreset")}
            type="button"
          >
            <Plus className="size-4" />
          </button>
          <label className="ml-1 flex shrink-0 cursor-pointer items-center gap-2 text-xs font-medium">
            <span className={cn("transition-opacity", !draft.enabled && "opacity-55")}>
              {t(draft.enabled ? "audioEqualizer.enabled" : "audioEqualizer.disabled")}
            </span>
            <Switch
              checked={draft.enabled}
              onCheckedChange={setEnabled}
              className="data-[state=checked]:bg-(--eq-accent) data-[state=unchecked]:bg-current/20 [&_[data-slot=switch-thumb]]:bg-primary-foreground!"
            />
          </label>
        </div>

        {activeCustomPreset ? (
          <div className="flex items-center gap-1 rounded-lg px-2.5 focus-within:bg-current/[0.04] hover:bg-current/[0.03]">
            <PencilLine className="size-3.5 shrink-0 opacity-45" />
            <input
              aria-label={t("audioEqualizer.presetName")}
              className="h-8 min-w-0 flex-1 bg-transparent px-1.5 text-xs font-medium outline-none"
              maxLength={40}
              onBlur={() => renameCustomPreset(activeCustomPreset.id, nameDraft)}
              onChange={(event) => setNameDraft(event.currentTarget.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") event.currentTarget.blur();
              }}
              placeholder={t("audioEqualizer.presetName")}
              value={nameDraft}
            />
            <button
              aria-label={t("audioEqualizer.duplicatePreset")}
              className={cn(iconButtonClass, "size-7")}
              onClick={() => duplicateCustomPreset(activeCustomPreset.id)}
              title={t("audioEqualizer.duplicatePreset")}
              type="button"
            >
              <Copy className="size-3.5" />
            </button>
            <button
              aria-label={t("audioEqualizer.deletePreset")}
              className={cn(iconButtonClass, "size-7 text-destructive hover:bg-destructive/10")}
              onClick={() => deleteCustomPreset(activeCustomPreset.id)}
              title={t("audioEqualizer.deletePreset")}
              type="button"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        ) : null}
      </div>

      <div className={cn("space-y-5 transition-opacity", !draft.enabled && "opacity-50")}>
        <PanelSection
          title={t("audioEqualizer.bandGain")}
          meta={headroomDb > 0 ? t("audioEqualizer.headroom", { db: headroomDb }) : null}
          action={
            <button
              className={cn(iconButtonClass, "size-7")}
              disabled={!hasBandGain}
              onClick={resetBands}
              title={t("audioEqualizer.resetBands")}
              aria-label={t("audioEqualizer.resetBands")}
              type="button"
            >
              <RotateCcw className="size-3.5" />
            </button>
          }
        >
          <div className="rounded-xl bg-current/[0.035] px-3 pt-5 pb-3">
            <EqualizerCurve
              bands={AUDIO_EQUALIZER_BANDS}
              gains={draft.gains}
              maxGain={AUDIO_EQUALIZER_MAX_GAIN_DB}
              onChange={updateBand}
              onCommit={commit}
              accentColor={accentColor}
              variant="flat"
              showActiveValue
              showScale
              plotClassName="h-36"
            />
          </div>
        </PanelSection>

        <PanelSection
          title={t("audioEqualizer.effects")}
          action={
            <button
              className={cn(iconButtonClass, "size-7")}
              disabled={!hasEffect}
              onClick={resetEffects}
              title={t("audioEqualizer.resetEffects")}
              aria-label={t("audioEqualizer.resetEffects")}
              type="button"
            >
              <RotateCcw className="size-3.5" />
            </button>
          }
        >
          <div className="space-y-4">
            {AUDIO_EFFECT_GROUPS.map((group) => (
              <div key={group.id} className="space-y-2.5">
                <div className="text-[10px] font-semibold tracking-wider uppercase opacity-45">
                  {t(`audioEqualizer.group.${group.id}`)}
                </div>
                <div className="grid grid-cols-2 gap-x-5 gap-y-3.5">
                  {group.effects.map((id) => (
                    <AudioEffectSlider
                      key={id}
                      control={AUDIO_EFFECT_CONTROL_MAP[id]}
                      label={t(`audioEqualizer.effect.${id}`)}
                      resetLabel={t("audioEqualizer.resetEffect")}
                      value={draft.effects[id]}
                      onChange={(value) => updateEffect(id, value)}
                      onCommit={commit}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </PanelSection>
      </div>
    </div>
  );
}

function PanelSection({ title, meta, action, children }: AudioEqualizerPanelSectionProps) {
  return (
    <section className="space-y-2">
      <div className="flex h-7 items-center gap-2">
        <h3 className="flex-1 text-xs font-semibold">{title}</h3>
        {meta ? <span className="text-[11px] tabular-nums opacity-55">{meta}</span> : null}
        {action}
      </div>
      {children}
    </section>
  );
}
