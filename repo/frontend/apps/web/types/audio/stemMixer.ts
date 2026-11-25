export type Stem = "drums" | "bass" | "other" | "vocals";
export type StemMixerPreset = "reset" | "karaoke" | "vocals";
export type StemMixerBlock = "noGpu" | "tooSlow";
export type StemMixerPhase =
  | "off"
  | "waiting"
  | "separating"
  | "ready"
  | "failed"
  | "notFollowing"
  | "tooLong"
  | "loadingModel";

export interface StemChannels {
  left: Float32Array<ArrayBuffer>;
  right: Float32Array<ArrayBuffer>;
}

export type StemWorkerRequest = { kind: "open" } | ({ kind: "separate" } & StemChannels);

export type StemWorkerReply =
  | { kind: "open" }
  | { kind: "loadingModel" }
  | { kind: "separated"; stems: StemChannels[]; wallMs: number }
  | { kind: "error"; message: string; unsupported: boolean };

export interface StemMixerAudioGraph {
  source: MediaElementAudioSourceNode;
  replayGain: GainNode;
}
