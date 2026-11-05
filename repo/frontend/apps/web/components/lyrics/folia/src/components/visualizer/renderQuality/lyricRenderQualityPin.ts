import { createContext, useContext } from "react";
import type { LyricRenderQuality } from "../../../types";
import { DEFAULT_LYRIC_RENDER_QUALITY } from "../../../utils/lyricRenderQuality";

// src/components/visualizer/renderQuality/lyricRenderQualityPin.ts
// 把歌词画布的分辨率与抗锯齿钉在一组固定值上（视频导出用）。不在它里面时什么也不钉。
// @note Folia 把全局挡位存在 useVisualizerSettingsStore、由「动画与性能」里的设置改；Scopify 没有这个设置，
// 全局挡位固定是默认值（各样式原来的样子）。以后加了设置入口，只需要让 useGlobalLyricRenderQuality 读它。

export const LyricRenderQualityPinContext = createContext<LyricRenderQuality | null>(null);

/** 钉住的那一组（导出时），没钉时是 null。 */
export const useLyricRenderQualityPin = (): LyricRenderQuality | null =>
  useContext(LyricRenderQualityPinContext);

/** 全局挡位：钉住时用钉住的值，否则是默认值。 */
export const useGlobalLyricRenderQuality = (): LyricRenderQuality => {
  const pinned = useLyricRenderQualityPin();
  return pinned ?? DEFAULT_LYRIC_RENDER_QUALITY;
};
