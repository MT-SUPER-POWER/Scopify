export interface ShaderViewportInput {
  cssHeight: number;
  cssWidth: number;
  devicePixelRatio: number;
  maxPixelCount: number;
}

export interface ShaderViewportProfile {
  aspectRatio: number;
  renderHeight: number;
  renderScale: number;
  renderWidth: number;
  /** Multiplies uniforms expressed in internal shader pixels. */
  uniformPixelScale: number;
}

/**
 * Resolves the physical render surface for one shader host. The profile is local
 * to that host: wallpaper, main window, and controller never share measurements.
 */
export function resolveShaderViewport({
  cssHeight,
  cssWidth,
  devicePixelRatio,
  maxPixelCount,
}: ShaderViewportInput): ShaderViewportProfile {
  const safeCssWidth = toNonNegativeFinite(cssWidth);
  const safeCssHeight = toNonNegativeFinite(cssHeight);
  const safeDpr = Math.max(1, toNonNegativeFinite(devicePixelRatio));
  const safeMaxPixelCount = toNonNegativeFinite(maxPixelCount);
  const nativeWidth = safeCssWidth * safeDpr;
  const nativeHeight = safeCssHeight * safeDpr;
  const nativePixelCount = nativeWidth * nativeHeight;
  const aspectRatio = safeCssHeight > 0 ? safeCssWidth / safeCssHeight : 1;

  if (nativePixelCount === 0) {
    return {
      aspectRatio,
      renderHeight: 0,
      renderScale: 1,
      renderWidth: 0,
      uniformPixelScale: 1,
    };
  }

  const renderScale =
    safeMaxPixelCount === 0 ? 0 : Math.min(1, Math.sqrt(safeMaxPixelCount / nativePixelCount));

  return {
    aspectRatio,
    renderHeight: Math.round(nativeHeight * renderScale),
    renderScale,
    renderWidth: Math.round(nativeWidth * renderScale),
    uniformPixelScale: renderScale,
  };
}

/** Keeps the apparent size of a pixel-based shader primitive stable after upscaling. */
export function scalePixelSizedShaderUniform(
  value: number,
  viewport: ShaderViewportProfile,
): number {
  return toNonNegativeFinite(value) * viewport.uniformPixelScale;
}

function toNonNegativeFinite(value: number): number {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}
