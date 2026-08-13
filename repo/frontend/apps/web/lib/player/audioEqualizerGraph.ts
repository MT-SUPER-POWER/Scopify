import { AUDIO_EQUALIZER_BANDS } from "@/constants/audioEqualizer";
import type { AudioEqualizerSettings } from "@/types/audioEqualizer";

const resolveFilterFrequency = (context: AudioContext, frequency: number) =>
  Math.min(frequency, context.sampleRate * 0.475);

export function connectAudioEqualizerGraph(
  context: AudioContext,
  input: AudioNode,
  output: AudioNode,
  settings: AudioEqualizerSettings,
) {
  const filters = AUDIO_EQUALIZER_BANDS.map((band, index) => {
    const filter = context.createBiquadFilter();
    filter.type =
      index === 0
        ? "lowshelf"
        : index === AUDIO_EQUALIZER_BANDS.length - 1
          ? "highshelf"
          : "peaking";
    filter.frequency.value = resolveFilterFrequency(context, band.frequency);
    filter.Q.value = 1.4;
    filter.gain.value = settings.enabled ? (settings.gains[index] ?? 0) : 0;
    return filter;
  });

  filters
    .reduce<AudioNode>((node, filter) => {
      node.connect(filter);
      return filter;
    }, input)
    .connect(output);
  return filters;
}

export function applyAudioEqualizerSettings(
  context: AudioContext,
  filters: BiquadFilterNode[],
  settings: AudioEqualizerSettings,
) {
  filters.forEach((filter, index) => {
    const gain = settings.enabled ? (settings.gains[index] ?? 0) : 0;
    filter.gain.cancelScheduledValues(context.currentTime);
    filter.gain.setTargetAtTime(gain, context.currentTime, 0.015);
  });
}
