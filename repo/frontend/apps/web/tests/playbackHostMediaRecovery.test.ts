import { describe, expect, mock, test } from "bun:test";

import { recoverPlaybackMediaError } from "@/hooks/player/usePlaybackMediaEvents";
import {
  shouldUseLegacyPlaybackCatalog,
  shouldWarmLegacyPlaybackUrl,
} from "@/hooks/player/usePlaybackMediaSource";

describe("Playback Host media recovery", () => {
  test("delegates to Host control without executing a legacy Store recovery", async () => {
    const onMediaError = mock(async () => undefined);
    const recoverWithLegacyStore = mock(async () => undefined);

    await expect(
      recoverPlaybackMediaError(
        { onMediaError },
        { errorCode: 2, errorMessage: "expired" },
        recoverWithLegacyStore,
      ),
    ).resolves.toBe("host");

    expect(onMediaError).toHaveBeenCalledWith({ errorCode: 2, errorMessage: "expired" });
    expect(recoverWithLegacyStore).not.toHaveBeenCalled();
  });

  test("keeps the legacy recovery path available outside the dedicated Host", async () => {
    const recoverWithLegacyStore = mock(async () => undefined);

    await expect(
      recoverPlaybackMediaError(
        undefined,
        { errorCode: null, errorMessage: null },
        recoverWithLegacyStore,
      ),
    ).resolves.toBe("legacy");

    expect(recoverWithLegacyStore).toHaveBeenCalledTimes(1);
  });

  test("keeps Host source and lyric resolution out of the legacy Store catalog", () => {
    const hostControl = {};

    expect(shouldUseLegacyPlaybackCatalog(hostControl)).toBeFalse();
    expect(
      shouldWarmLegacyPlaybackUrl({
        externalSessionControl: hostControl,
        hasSong: true,
        hasSourceUrl: false,
        hasWarmed: false,
      }),
    ).toBeFalse();
    expect(shouldUseLegacyPlaybackCatalog(undefined)).toBeTrue();
    expect(
      shouldWarmLegacyPlaybackUrl({
        externalSessionControl: undefined,
        hasSong: true,
        hasSourceUrl: false,
        hasWarmed: false,
      }),
    ).toBeTrue();
  });
});
