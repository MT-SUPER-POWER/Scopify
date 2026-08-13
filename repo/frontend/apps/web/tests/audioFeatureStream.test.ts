import { describe, expect, test } from "bun:test";

import { createAudioFeatureStream, isAudioFeatureStreamCurrent } from "@/lib/audioFeature/stream";

describe("AudioFeatureStream", () => {
  test("starts every authoritative stream at sequence zero", () => {
    const stream = createAudioFeatureStream(
      { authorityId: "authority-a", sessionId: "session-a" },
      { createStreamId: () => "stream-a" },
    );

    expect(stream.streamId).toBe("stream-a");
    expect(stream.nextSequence()).toBe(0);
    expect(stream.nextSequence()).toBe(1);
  });

  test("does not consider a changed authority or session current", () => {
    const stream = createAudioFeatureStream(
      { authorityId: "authority-a", sessionId: "session-a" },
      { createStreamId: () => "stream-a" },
    );

    expect(
      isAudioFeatureStreamCurrent(stream, { authorityId: "authority-a", sessionId: "session-a" }),
    ).toBeTrue();
    expect(
      isAudioFeatureStreamCurrent(stream, { authorityId: "authority-b", sessionId: "session-a" }),
    ).toBeFalse();
    expect(
      isAudioFeatureStreamCurrent(stream, { authorityId: "authority-a", sessionId: "session-b" }),
    ).toBeFalse();
  });
});
