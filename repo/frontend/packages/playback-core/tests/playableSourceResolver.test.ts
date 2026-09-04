import { describe, expect, test } from "bun:test";
import {
  createMemoryPlayableSourceCache,
  createPlayableSourceResolver,
  type PlayableSourceAdapter,
  type PlaybackQueueItem,
  type SourceResolveRequest,
} from "../src";

const track: PlaybackQueueItem = {
  locator: { kind: "netease", songId: "1964503912" },
  queueItemId: "vip-track",
  track: { artistNames: ["Artist"], id: "1964503912", title: "VIP track" },
};

function request(overrides: Partial<SourceResolveRequest> = {}): SourceResolveRequest {
  return {
    excludedCandidateIds: [],
    quality: "lossless",
    reason: "initial",
    sessionRevision: 1,
    signal: new AbortController().signal,
    ...overrides,
  };
}

describe("PlayableSourceResolver", () => {
  test("returns a cached unexpired source without asking the source adapter again", async () => {
    let url = "https://cdn.example.test/first.flac";
    const adapter: PlayableSourceAdapter = {
      resolve: async () => ({
        source: {
          candidateId: "netease:1964503912:lossless",
          expiresAtMs: 20_000,
          kind: "remote",
          quality: "lossless",
          url,
        },
        status: "resolved",
      }),
    };
    const resolver = createPlayableSourceResolver({
      adapters: { netease: adapter },
      cache: createMemoryPlayableSourceCache(),
      clock: { nowMs: () => 1_000 },
    });

    const first = await resolver.resolve(track, request());
    url = "https://cdn.example.test/second.flac";
    const second = await resolver.resolve(track, request());

    expect(first).toEqual({
      source: expect.objectContaining({ url: "https://cdn.example.test/first.flac" }),
      status: "resolved",
    });
    expect(second).toEqual(first);
  });

  test("does not reuse a source from a previous signed-in session", async () => {
    let url = "https://cdn.example.test/session-one.flac";
    const adapter: PlayableSourceAdapter = {
      resolve: async () => ({
        source: {
          candidateId: "netease:1964503912:lossless",
          kind: "remote",
          quality: "lossless",
          url,
        },
        status: "resolved",
      }),
    };
    const resolver = createPlayableSourceResolver({ adapters: { netease: adapter } });

    await resolver.resolve(track, request({ sessionRevision: 1 }));
    url = "https://cdn.example.test/session-two.flac";
    const result = await resolver.resolve(track, request({ sessionRevision: 2 }));

    expect(result).toEqual({
      source: expect.objectContaining({ url: "https://cdn.example.test/session-two.flac" }),
      status: "resolved",
    });
  });

  test("reports a source kind unsupported by the selected runtime", async () => {
    const resolver = createPlayableSourceResolver({ adapters: {} });

    const result = await resolver.resolve(
      { ...track, locator: { fileId: "local-1", kind: "local" } },
      request(),
    );

    expect(result).toEqual({
      reason: "local-source-not-supported",
      status: "unsupported",
    });
  });

  test("does not return a candidate the session already rejected", async () => {
    const adapter: PlayableSourceAdapter = {
      resolve: async () => ({
        source: {
          candidateId: "netease:1964503912:lossless",
          kind: "remote",
          quality: "lossless",
          url: "https://cdn.example.test/song.flac",
        },
        status: "resolved",
      }),
    };
    const resolver = createPlayableSourceResolver({ adapters: { netease: adapter } });

    const result = await resolver.resolve(
      track,
      request({ excludedCandidateIds: ["netease:1964503912:lossless"] }),
    );

    expect(result).toEqual({
      reason: "source-candidate-excluded",
      retryable: false,
      status: "unavailable",
    });
  });

  test("does not publish a source resolved after the active request is aborted", async () => {
    let settle!: () => void;
    const adapter: PlayableSourceAdapter = {
      resolve: async () => {
        await new Promise<void>((resolve) => {
          settle = resolve;
        });
        return {
          source: {
            candidateId: "netease:1964503912:lossless",
            kind: "remote",
            quality: "lossless",
            url: "https://cdn.example.test/song.flac",
          },
          status: "resolved",
        };
      },
    };
    const resolver = createPlayableSourceResolver({ adapters: { netease: adapter } });
    const controller = new AbortController();

    const resolution = resolver.resolve(track, request({ signal: controller.signal }));
    controller.abort();
    settle();

    await expect(resolution).resolves.toEqual({
      reason: "resolution-aborted",
      retryable: false,
      status: "unavailable",
    });
  });
});
