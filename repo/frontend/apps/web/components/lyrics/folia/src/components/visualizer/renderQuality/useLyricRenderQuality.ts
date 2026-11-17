import { useMemo } from "react";
import type { LyricRenderOverride, LyricRenderQuality } from "../../../types";
import {
  DEFAULT_LYRIC_RENDER_QUALITY,
  resolveLyricRenderQuality,
} from "../../../utils/lyricRenderQuality";
import { useGlobalLyricRenderQuality, useLyricRenderQualityPin } from "./lyricRenderQualityPin";

/** Gallery previews use the style defaults. A pin supplies the exact setting for this surface. */
export const useLyricRenderQuality = (
  override?: LyricRenderOverride | null,
  isPreviewMode = false,
): LyricRenderQuality => {
  const pinned = useLyricRenderQualityPin();
  const global = useGlobalLyricRenderQuality();
  return useMemo(
    () =>
      pinned ??
      (isPreviewMode ? DEFAULT_LYRIC_RENDER_QUALITY : resolveLyricRenderQuality(global, override)),
    [global, isPreviewMode, override, pinned],
  );
};
