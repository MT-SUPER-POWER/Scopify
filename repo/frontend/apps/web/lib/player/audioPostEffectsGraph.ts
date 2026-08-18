import type { AudioEffectSettings } from "@/types/audioEqualizer";

export interface AudioPostEffectsGraph {
  apply: (effects: AudioEffectSettings) => void;
  dispose: () => void;
  input: GainNode;
}

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
  mixBus.connect(limiter).connect(output);
  wowLfo.connect(wowDepth).connect(wowDelay.delayTime);
  noise.start();
  wowLfo.start();

  const apply = (effects: AudioEffectSettings) => {
    const now = context.currentTime;
    highpass.frequency.setTargetAtTime(effects.highpass, now, 0.02);
    lowpass.frequency.setTargetAtTime(
      Math.min(effects.lowpass, context.sampleRate * 0.475),
      now,
      0.02,
    );
    drive.curve = effects.drive > 0.001 ? createDriveCurve(effects.drive) : null;
    crush.curve = effects.crush > 0.001 ? createCrushCurve(effects.crush) : null;
    wowDelay.delayTime.setTargetAtTime(effects.wow * 0.006, now, 0.04);
    wowDepth.gain.setTargetAtTime(effects.wow * 0.0045, now, 0.04);
    punch.gain.setTargetAtTime(effects.punch * 9, now, 0.03);
    const cross = (1 - effects.width) * 0.5;
    const direct = 1 - cross;
    directLeft.gain.setTargetAtTime(direct, now, 0.03);
    directRight.gain.setTargetAtTime(direct, now, 0.03);
    crossLeft.gain.setTargetAtTime(cross, now, 0.03);
    crossRight.gain.setTargetAtTime(cross, now, 0.03);
    dry.gain.setTargetAtTime(Math.cos(effects.space * Math.PI * 0.5), now, 0.04);
    wet.gain.setTargetAtTime(Math.sin(effects.space * Math.PI * 0.5) * 0.42, now, 0.04);
    noiseGain.gain.setTargetAtTime(effects.noise ** 1.4 * 0.12, now, 0.06);
  };

  apply(initial);
  return {
    apply,
    input,
    dispose: () => {
      noise.stop();
      wowLfo.stop();
      input.disconnect();
    },
  };
}
