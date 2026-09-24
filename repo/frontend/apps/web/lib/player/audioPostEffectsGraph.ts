import type { AudioEffectSettings, AudioPostEffectsGraph } from "@/types/audioEqualizer";

export type { AudioPostEffectsGraph } from "@/types/audioEqualizer";

const createDriveCurve = (amount: number) => {
  const curve = new Float32Array(1024);
  const strength = 1 + amount * 36;
  for (let index = 0; index < curve.length; index += 1) {
    const x = (index / (curve.length - 1)) * 2 - 1;
    curve[index] = Math.tanh(x * strength) / Math.tanh(strength);
  }
  return curve;
};

const createCrushCurve = (amount: number) => {
  const curve = new Float32Array(1024);
  const steps = Math.max(4, Math.round(256 - amount * 248));
  for (let index = 0; index < curve.length; index += 1) {
    const x = (index / (curve.length - 1)) * 2 - 1;
    curve[index] = Math.round(x * steps) / steps;
  }
  return curve;
};

const createImpulse = (context: AudioContext) => {
  const length = Math.round(context.sampleRate * 2.2);
  const buffer = context.createBuffer(2, length, context.sampleRate);
  for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
    const data = buffer.getChannelData(channel);
    for (let index = 0; index < length; index += 1) {
      data[index] = (Math.random() * 2 - 1) * (1 - index / length) ** 2.8;
    }
  }
  return buffer;
};

const createNoiseBuffer = (context: AudioContext) => {
  const buffer = context.createBuffer(1, context.sampleRate * 2, context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let index = 0; index < data.length; index += 1) data[index] = Math.random() * 2 - 1;
  return buffer;
};

export function connectAudioPostEffectsGraph(
  context: AudioContext,
  output: AudioNode,
  initial: AudioEffectSettings,
): AudioPostEffectsGraph {
  const input = context.createGain();
  const highpass = context.createBiquadFilter();
  highpass.type = "highpass";
  const lowpass = context.createBiquadFilter();
  lowpass.type = "lowpass";
  const drive = context.createWaveShaper();
  drive.oversample = "2x";
  const crush = context.createWaveShaper();
  const wowDelay = context.createDelay(0.03);
  const punch = context.createBiquadFilter();
  punch.type = "lowshelf";
  punch.frequency.value = 120;
  const splitter = context.createChannelSplitter(2);
  const merger = context.createChannelMerger(2);
  const directLeft = context.createGain();
  const directRight = context.createGain();
  const crossLeft = context.createGain();
  const crossRight = context.createGain();
  const dry = context.createGain();
  const wet = context.createGain();
  const convolver = context.createConvolver();
  convolver.buffer = createImpulse(context);
  const noiseGain = context.createGain();
  const mixBus = context.createGain();
  const limiter = context.createDynamicsCompressor();
  limiter.threshold.value = -2;
  limiter.knee.value = 0;
  limiter.ratio.value = 20;
  limiter.attack.value = 0.003;
  limiter.release.value = 0.12;
  const noise = context.createBufferSource();
  noise.buffer = createNoiseBuffer(context);
  noise.loop = true;
  const wowLfo = context.createOscillator();
  const wowDepth = context.createGain();
  wowLfo.frequency.value = 0.72;

  input
    .connect(highpass)
    .connect(lowpass)
    .connect(drive)
    .connect(crush)
    .connect(wowDelay)
    .connect(punch)
    .connect(splitter);
  splitter.connect(directLeft, 0).connect(merger, 0, 0);
  splitter.connect(directRight, 1).connect(merger, 0, 1);
  splitter.connect(crossLeft, 0).connect(merger, 0, 1);
  splitter.connect(crossRight, 1).connect(merger, 0, 0);
  merger.connect(dry).connect(mixBus);
  merger.connect(convolver).connect(wet).connect(mixBus);
  noise.connect(noiseGain).connect(mixBus);
  wowLfo.connect(wowDepth).connect(wowDelay.delayTime);

  const apply = (effects: AudioEffectSettings, initialise = false) => {
    const now = context.currentTime;
    const setParameter = (parameter: AudioParam, value: number, timeConstant: number) => {
      if (initialise) parameter.setValueAtTime(value, now);
      else parameter.setTargetAtTime(value, now, timeConstant);
    };
    setParameter(highpass.frequency, effects.highpass, 0.02);
    setParameter(lowpass.frequency, Math.min(effects.lowpass, context.sampleRate * 0.475), 0.02);
    drive.curve = effects.drive > 0.001 ? createDriveCurve(effects.drive) : null;
    crush.curve = effects.crush > 0.001 ? createCrushCurve(effects.crush) : null;
    setParameter(wowDelay.delayTime, effects.wow * 0.006, 0.04);
    setParameter(wowDepth.gain, effects.wow * 0.0045, 0.04);
    setParameter(punch.gain, effects.punch * 9, 0.03);
    const cross = (1 - effects.width) * 0.5;
    const direct = 1 - cross;
    setParameter(directLeft.gain, direct, 0.03);
    setParameter(directRight.gain, direct, 0.03);
    setParameter(crossLeft.gain, cross, 0.03);
    setParameter(crossRight.gain, cross, 0.03);
    setParameter(dry.gain, Math.cos(effects.space * Math.PI * 0.5), 0.04);
    setParameter(wet.gain, Math.sin(effects.space * Math.PI * 0.5) * 0.42, 0.04);
    setParameter(noiseGain.gain, effects.noise ** 1.4 * 0.12, 0.06);
  };

  // GainNode starts at 1: ramping the wow depth down from that default bends
  // pitch even when wow is disabled. Initialise every parameter before any
  // generated source can reach the output; only later user edits should ramp.
  apply(initial, true);
  mixBus.connect(limiter).connect(output);
  noise.start();
  wowLfo.start();
  return {
    apply: (effects) => apply(effects),
    input,
    dispose: () => {
      noise.stop();
      wowLfo.stop();
      input.disconnect();
    },
  };
}
