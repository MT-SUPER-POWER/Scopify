/**
 * Versioned high-frequency audio feature protocol. This stream is deliberately
 * independent from reliable playback projection messages: delivery is
 * best-effort and consumers always prefer the newest frame.
 */
export const AUDIO_FEATURE_PROTOCOL_VERSION = 1 as const;
export const AUDIO_FEATURE_MAX_SPECTRUM_BINS = 256 as const;
export const AUDIO_FEATURE_MAX_ID_LENGTH = 128 as const;

export type AudioFeatureProtocolVersion = typeof AUDIO_FEATURE_PROTOCOL_VERSION;

export type AudioFeatureTransportRole = "publisher" | "subscriber";

export interface AudioFeatureFrameV1 {
  authorityId: string;
  bass: number;
  lowMid: number;
  mid: number;
  power: number;
  protocolVersion: AudioFeatureProtocolVersion;
  sampledAtMs: number;
  sequence: number;
  sessionId: string;
  spectrum: number[];
  streamId: string;
  treble: number;
  type: "audio-feature-frame";
  vocal: number;
}

export interface AudioFeatureAck {
  sequence: number;
  streamId: string;
  type: "audio-feature-ack";
}

export type AudioFeatureTransportPayload = AudioFeatureAck | AudioFeatureFrameV1;

export type AudioFeatureFrameValidationResult =
  { frame: AudioFeatureFrameV1; success: true } | { reason: string; success: false };

export type AudioFeatureAckValidationResult =
  { ack: AudioFeatureAck; success: true } | { reason: string; success: false };

export type AudioFeatureTransportPayloadValidationResult =
  { payload: AudioFeatureTransportPayload; success: true } | { reason: string; success: false };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isNonEmptyIdentity(value: unknown): value is string {
  return (
    typeof value === "string" && value.length > 0 && value.length <= AUDIO_FEATURE_MAX_ID_LENGTH
  );
}

function isNonNegativeSafeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

function isSampledAtMs(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function isBandValue(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 255;
}

function isSpectrum(value: unknown): value is number[] {
  return (
    Array.isArray(value) &&
    value.length <= AUDIO_FEATURE_MAX_SPECTRUM_BINS &&
    value.every(isBandValue)
  );
}

export function validateAudioFeatureFrame(value: unknown): AudioFeatureFrameValidationResult {
  if (!isRecord(value)) return { reason: "frame-not-an-object", success: false };
  if (value.type !== "audio-feature-frame") {
    return { reason: "invalid-frame-type", success: false };
  }
  if (value.protocolVersion !== AUDIO_FEATURE_PROTOCOL_VERSION) {
    return { reason: "unsupported-protocol-version", success: false };
  }
  if (
    !isNonEmptyIdentity(value.authorityId) ||
    !isNonEmptyIdentity(value.sessionId) ||
    !isNonEmptyIdentity(value.streamId)
  ) {
    return { reason: "invalid-frame-identity", success: false };
  }
  if (!isNonNegativeSafeInteger(value.sequence)) {
    return { reason: "invalid-frame-sequence", success: false };
  }
  if (!isSampledAtMs(value.sampledAtMs)) {
    return { reason: "invalid-frame-sampled-at", success: false };
  }
  if (
    !isBandValue(value.bass) ||
    !isBandValue(value.lowMid) ||
    !isBandValue(value.mid) ||
    !isBandValue(value.vocal) ||
    !isBandValue(value.treble) ||
    !isBandValue(value.power) ||
    !isSpectrum(value.spectrum)
  ) {
    return { reason: "invalid-frame-features", success: false };
  }

  return { frame: value as unknown as AudioFeatureFrameV1, success: true };
}

export function isAudioFeatureFrame(value: unknown): value is AudioFeatureFrameV1 {
  return validateAudioFeatureFrame(value).success;
}

export function validateAudioFeatureAck(value: unknown): AudioFeatureAckValidationResult {
  if (!isRecord(value)) return { reason: "ack-not-an-object", success: false };
  if (value.type !== "audio-feature-ack") return { reason: "invalid-ack-type", success: false };
  if (!isNonEmptyIdentity(value.streamId))
    return { reason: "invalid-ack-stream-id", success: false };
  if (!isNonNegativeSafeInteger(value.sequence)) {
    return { reason: "invalid-ack-sequence", success: false };
  }

  return { ack: value as unknown as AudioFeatureAck, success: true };
}

export function isAudioFeatureAck(value: unknown): value is AudioFeatureAck {
  return validateAudioFeatureAck(value).success;
}

export function validateAudioFeatureTransportPayload(
  value: unknown,
): AudioFeatureTransportPayloadValidationResult {
  const frame = validateAudioFeatureFrame(value);
  if (frame.success) return { payload: frame.frame, success: true };

  const ack = validateAudioFeatureAck(value);
  if (ack.success) return { payload: ack.ack, success: true };

  return { reason: "invalid-audio-feature-transport-payload", success: false };
}

export function isAudioFeatureTransportPayload(
  value: unknown,
): value is AudioFeatureTransportPayload {
  return validateAudioFeatureTransportPayload(value).success;
}
