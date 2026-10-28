import type { AudioEffectControl } from "@/types/audio/equalizer";

/** Effect sliders run over 0–1000 so log-scaled controls (Hz) get an even feel. */
export const AUDIO_EFFECT_SLIDER_MAX = 1000;

export const toEffectSliderPosition = (control: AudioEffectControl, value: number) => {
  if (control.scale === "log") {
    const min = Math.log(control.min);
    return Math.round(
      ((Math.log(value) - min) / (Math.log(control.max) - min)) * AUDIO_EFFECT_SLIDER_MAX,
    );
  }
  return Math.round(
    ((value - control.min) / (control.max - control.min)) * AUDIO_EFFECT_SLIDER_MAX,
  );
};

export const fromEffectSliderPosition = (control: AudioEffectControl, position: number) => {
  const ratio = Math.min(1, Math.max(0, position / AUDIO_EFFECT_SLIDER_MAX));
  if (control.scale === "log") {
    return Math.round(
      Math.exp(Math.log(control.min) + ratio * (Math.log(control.max) - Math.log(control.min))),
    );
  }
  const value = control.min + ratio * (control.max - control.min);
  return Number((Math.round(value / control.step) * control.step).toFixed(4));
};

export const formatEffectValue = (control: AudioEffectControl, value: number) =>
  control.unit === "hz"
    ? value >= 1000
      ? `${(value / 1000).toFixed(1)} kHz`
      : `${Math.round(value)} Hz`
    : `${Math.round(value * 100)}%`;
