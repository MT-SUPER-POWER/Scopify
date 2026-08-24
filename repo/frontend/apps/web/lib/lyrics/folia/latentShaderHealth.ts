export const LATENT_SHADER_STALL_TIMEOUT_MS = 1_000;

export function shouldRestartLatentShader(
  currentFrame: number,
  previousFrame: number,
  lastProgressAt: number,
  now: number,
  paused: boolean,
  documentVisible: boolean,
  layerVisible: boolean,
) {
  return (
    !paused &&
    documentVisible &&
    layerVisible &&
    currentFrame === previousFrame &&
    now - lastProgressAt >= LATENT_SHADER_STALL_TIMEOUT_MS
  );
}
