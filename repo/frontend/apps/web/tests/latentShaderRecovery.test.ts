import { describe, expect, test } from "bun:test";

import {
  LATENT_SHADER_STALL_TIMEOUT_MS,
  shouldRestartLatentShader,
} from "@/lib/lyrics/folia/latentShaderHealth";

describe("Folia latent shader recovery", () => {
  test("restarts a visible playing shader after its frame stops progressing", () => {
    expect(
      shouldRestartLatentShader(
        120,
        120,
        1_000,
        1_000 + LATENT_SHADER_STALL_TIMEOUT_MS,
        false,
        true,
        true,
      ),
    ).toBeTrue();
  });

  test("does not restart while the shader progresses, playback is paused, or the layer is hidden", () => {
    const now = 1_000 + LATENT_SHADER_STALL_TIMEOUT_MS;

    expect(shouldRestartLatentShader(121, 120, 1_000, now, false, true, true)).toBeFalse();
    expect(shouldRestartLatentShader(120, 120, 1_000, now, true, true, true)).toBeFalse();
    expect(shouldRestartLatentShader(120, 120, 1_000, now, false, false, true)).toBeFalse();
    expect(shouldRestartLatentShader(120, 120, 1_000, now, false, true, false)).toBeFalse();
  });
});
