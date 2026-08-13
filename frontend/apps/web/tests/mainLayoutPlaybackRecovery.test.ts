import { describe, expect, test } from "bun:test";

import {
  shouldUseLegacyPlaybackCatalog,
  shouldWarmLegacyPlaybackUrl,
} from "@/hooks/player/usePlaybackMediaSource";
import type { PlaybackAuthorityExternalSessionControl } from "@/types/playbackAuthority";

const hostCatalog: PlaybackAuthorityExternalSessionControl = {};

describe("playback recovery ownership", () => {
  test("keeps restored URL warming in browser playback and out of the Host catalog", () => {
    expect(shouldUseLegacyPlaybackCatalog(undefined)).toBeTrue();
    expect(shouldUseLegacyPlaybackCatalog(hostCatalog)).toBeFalse();

    expect(
      shouldWarmLegacyPlaybackUrl({
        externalSessionControl: undefined,
        hasSong: true,
        hasSourceUrl: false,
        hasWarmed: false,
      }),
    ).toBeTrue();
    expect(
      shouldWarmLegacyPlaybackUrl({
        externalSessionControl: hostCatalog,
        hasSong: true,
        hasSourceUrl: false,
        hasWarmed: false,
      }),
    ).toBeFalse();
  });

  test("does not warm an already loaded, absent, or previously restored browser source", () => {
    for (const input of [
      { hasSong: false, hasSourceUrl: false, hasWarmed: false },
      { hasSong: true, hasSourceUrl: true, hasWarmed: false },
      { hasSong: true, hasSourceUrl: false, hasWarmed: true },
    ]) {
      expect(
        shouldWarmLegacyPlaybackUrl({ externalSessionControl: undefined, ...input }),
      ).toBeFalse();
    }
  });
});
