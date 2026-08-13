import { describe, expect, test } from "bun:test";

import {
  AUDIO_FEATURE_MAX_ID_LENGTH,
  AUDIO_FEATURE_PROTOCOL_VERSION,
  type AudioFeatureFrameV1,
  validateAudioFeatureAck,
  validateAudioFeatureFrame,
  validateAudioFeatureTransportPayload,
} from "@scopifymusicplayer/desktop-contract";

function createFrame(overrides: Partial<AudioFeatureFrameV1> = {}): AudioFeatureFrameV1 {
  return {
    authorityId: "authority-a",
    bass: 10,
    lowMid: 20,
    mid: 30,
    power: 60,
    protocolVersion: AUDIO_FEATURE_PROTOCOL_VERSION,
    sampledAtMs: 1_000,
    sequence: 0,
    sessionId: "session-a",
    spectrum: [10, 20, 30],
    streamId: "stream-a",
    treble: 40,
    type: "audio-feature-frame",
    vocal: 50,
    ...overrides,
  };
}

describe("audio feature contract", () => {
  test("accepts a complete version 1 frame and ACK", () => {
    const frame = createFrame();
    const ack = {
      sequence: frame.sequence,
      streamId: frame.streamId,
      type: "audio-feature-ack",
    } as const;

    expect(validateAudioFeatureFrame(frame)).toEqual({ frame, success: true });
    expect(validateAudioFeatureAck(ack)).toEqual({ ack, success: true });
    expect(validateAudioFeatureTransportPayload(frame)).toEqual({ payload: frame, success: true });
    expect(validateAudioFeatureTransportPayload(ack)).toEqual({ payload: ack, success: true });
  });

  test("rejects invalid frame identity, sequence, timestamp, and band data", () => {
    expect(validateAudioFeatureFrame(createFrame({ authorityId: "" }))).toEqual({
      reason: "invalid-frame-identity",
      success: false,
    });
    expect(
      validateAudioFeatureFrame(
        createFrame({ sessionId: "a".repeat(AUDIO_FEATURE_MAX_ID_LENGTH + 1) }),
      ),
    ).toEqual({ reason: "invalid-frame-identity", success: false });
    expect(
      validateAudioFeatureFrame(createFrame({ sequence: Number.MAX_SAFE_INTEGER + 1 })),
    ).toEqual({
      reason: "invalid-frame-sequence",
      success: false,
    });
    expect(validateAudioFeatureFrame(createFrame({ sampledAtMs: Number.NaN }))).toEqual({
      reason: "invalid-frame-sampled-at",
      success: false,
    });
    expect(validateAudioFeatureFrame(createFrame({ bass: 256 }))).toEqual({
      reason: "invalid-frame-features",
      success: false,
    });
  });

  test("bounds every spectrum band and its bin count", () => {
    expect(validateAudioFeatureFrame(createFrame({ spectrum: [-1] }))).toEqual({
      reason: "invalid-frame-features",
      success: false,
    });
    expect(validateAudioFeatureFrame(createFrame({ spectrum: Array(257).fill(0) }))).toEqual({
      reason: "invalid-frame-features",
      success: false,
    });
  });

  test("rejects malformed ACKs and unknown transport payloads", () => {
    expect(
      validateAudioFeatureAck({ sequence: -1, streamId: "stream-a", type: "audio-feature-ack" }),
    ).toEqual({
      reason: "invalid-ack-sequence",
      success: false,
    });
    expect(validateAudioFeatureTransportPayload({ type: "audio-feature-unknown" })).toEqual({
      reason: "invalid-audio-feature-transport-payload",
      success: false,
    });
  });
});
