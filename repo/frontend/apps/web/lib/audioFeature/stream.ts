import type {
  AudioFeatureStream,
  AudioFeatureStreamIdentity,
  AudioFeatureStreamOptions,
} from "@/types/audioFeaturePublisher";

let fallbackStreamOrdinal = 0;

/**
 * Owns the ordering envelope for one authoritative playback session.
 * A stream is deliberately never resumed after its authority or session changes.
 */
export function createAudioFeatureStream(
  identity: AudioFeatureStreamIdentity,
  options: AudioFeatureStreamOptions = {},
): AudioFeatureStream {
  let sequence = 0;
  const streamId = (options.createStreamId ?? createStreamId)();

  return {
    ...identity,
    nextSequence: () => {
      const next = sequence;
      sequence += 1;
      return next;
    },
    streamId,
  };
}

export function isAudioFeatureStreamCurrent(
  stream: AudioFeatureStream | null,
  identity: AudioFeatureStreamIdentity,
): stream is AudioFeatureStream {
  return stream?.authorityId === identity.authorityId && stream.sessionId === identity.sessionId;
}

function createStreamId(): string {
  const randomId = globalThis.crypto?.randomUUID?.();
  if (randomId) return `audio-feature-${randomId}`;

  fallbackStreamOrdinal += 1;
  return `audio-feature-${Date.now().toString(36)}-${fallbackStreamOrdinal.toString(36)}`;
}
