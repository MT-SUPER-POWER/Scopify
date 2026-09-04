import { describe, expect, test } from "bun:test";
import type { SourceResolveRequest } from "@scopify/playback-core";

import {
  createWebNeteasePlayableSourceResolver,
  NeteasePlayableSourceAdapter,
} from "@/lib/player/adapters/neteasePlayableSourceAdapter";
import type { NeteasePlayableSourceAdapterDependencies } from "@/types/playbackAdapters";

function createRequest(overrides: Partial<SourceResolveRequest> = {}): SourceResolveRequest {
  return {
    excludedCandidateIds: [],
    quality: "lossless",
    reason: "initial",
    sessionRevision: 0,
    signal: new AbortController().signal,
    ...overrides,
  };
}

function createDependencies(
  overrides: Partial<NeteasePlayableSourceAdapterDependencies> = {},
): NeteasePlayableSourceAdapterDependencies {
  return {
    clearCachedPlayUrl: async () => undefined,
    getCachedPlayUrl: async () => null,
    getSongUrlWithQuality: async () => ({
      data: "https://cdn.example.test/track.flac?temporary-capability=secret",
      replayGainTrackGain: -7.5,
    }),
    setCachedPlayUrl: async () => undefined,
    setCachedReplayGain: async () => undefined,
    ...overrides,
  };
}

describe("NeteasePlayableSourceAdapter", () => {
  test("returns a cached signed URL without calling the backend", async () => {
    let backendCalls = 0;
    const adapter = new NeteasePlayableSourceAdapter(
      createDependencies({
        getCachedPlayUrl: async () => "https://cdn.example.test/cached.flac?secret=yes",
        getSongUrlWithQuality: async () => {
          backendCalls += 1;
          return { data: "https://cdn.example.test/unused.flac" };
        },
      }),
    );

    const resolution = await adapter.resolve(
      { kind: "netease", songId: "1964503912" },
      createRequest(),
    );

    expect(resolution).toMatchObject({
      source: {
        candidateId: "netease:1964503912:lossless",
        kind: "remote",
        quality: "lossless",
        url: "https://cdn.example.test/cached.flac?secret=yes",
      },
      status: "resolved",
    });
    const expiresAtMs =
      resolution.status === "resolved" && resolution.source.kind === "remote"
        ? resolution.source.expiresAtMs
        : undefined;
    expect(expiresAtMs).toEqual(expect.any(Number));
    expect(backendCalls).toBe(0);
  });

  test("persists a newly resolved URL and ReplayGain before returning the source", async () => {
    const writes: string[] = [];
    const adapter = new NeteasePlayableSourceAdapter(
      createDependencies({
        setCachedPlayUrl: async (songId, quality, url) => {
          writes.push(`url:${songId}:${quality}:${url.includes("temporary-capability")}`);
        },
        setCachedReplayGain: async (songId, gain) => {
          writes.push(`gain:${songId}:${gain}`);
        },
      }),
    );

    const resolution = await adapter.resolve(
      { kind: "netease", songId: "1964503912" },
      createRequest({ quality: "master" }),
    );

    expect(resolution).toMatchObject({
      source: { candidateId: "netease:1964503912:master", kind: "remote", quality: "master" },
      status: "resolved",
    });
    expect(writes).toEqual(["url:1964503912:jymaster:true", "gain:1964503912:-7.5"]);
  });

  test("the compatibility resolver clears persistent and in-memory sources together", async () => {
    const clears: Array<[number, string]> = [];
    let backendCalls = 0;
    const resolver = createWebNeteasePlayableSourceResolver(
      createDependencies({
        clearCachedPlayUrl: async (songId, quality) => {
          clears.push([songId, quality]);
        },
        getSongUrlWithQuality: async () => {
          backendCalls += 1;
          return { data: `https://cdn.example.test/${backendCalls}.flac` };
        },
      }),
    );

    const first = await resolver.resolve(42, "high");
    const second = await resolver.resolve(42, "high");
    await resolver.invalidate(42, "high");
    const third = await resolver.resolve(42, "high");

    expect(first).toMatchObject({ source: { url: "https://cdn.example.test/1.flac" } });
    expect(second).toMatchObject({ source: { url: "https://cdn.example.test/1.flac" } });
    expect(third).toMatchObject({ source: { url: "https://cdn.example.test/2.flac" } });
    expect(backendCalls).toBe(2);
    expect(clears).toEqual([[42, "high"]]);
  });
});
