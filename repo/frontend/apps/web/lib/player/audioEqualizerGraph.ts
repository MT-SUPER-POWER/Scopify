import { AUDIO_EQUALIZER_BANDS } from "@/constants/audioEqualizer";
import type { AudioEqualizerSettings } from "@/types/audioEqualizer";

const resolveFilterFrequency = (context: AudioContext, frequency: number) =>
  Math.min(frequency, context.sampleRate * 0.475);

export interface AudioEqualizerGraph {
  filters: BiquadFilterNode[];
  preamp: GainNode;
}

const resolveHeadroomRatio = (settings: AudioEqualizerSettings) => {
  if (!settings.enabled) return 1;
  const maximumBoostDb = Math.max(0, ...settings.gains);
  return 10 ** (-maximumBoostDb / 20);
};

export function connectAudioEqualizerGraph(
  context: AudioContext,
  input: AudioNode,
  output: AudioNode,
  settings: AudioEqualizerSettings,
) {
  const preamp = context.createGain();
  preamp.gain.value = resolveHeadroomRatio(settings);
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
    }, preamp)
    .connect(output);
  input.connect(preamp);
  return { filters, preamp };
}

export function applyAudioEqualizerSettings(
  context: AudioContext,
  graph: AudioEqualizerGraph,
  settings: AudioEqualizerSettings,
) {
  graph.preamp.gain.cancelScheduledValues(context.currentTime);
  graph.preamp.gain.setTargetAtTime(resolveHeadroomRatio(settings), context.currentTime, 0.03);
  graph.filters.forEach((filter, index) => {
    const gain = settings.enabled ? (settings.gains[index] ?? 0) : 0;
    filter.gain.cancelScheduledValues(context.currentTime);
    filter.gain.setTargetAtTime(gain, context.currentTime, 0.015);
  });
}
