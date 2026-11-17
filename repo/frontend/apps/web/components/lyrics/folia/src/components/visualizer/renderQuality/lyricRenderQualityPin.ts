import { createContext, useContext } from "react";
import { useLyricStageStore } from "@/store/module/lyrics";
import type { LyricRenderQuality } from "../../../types";

// src/components/visualizer/renderQuality/lyricRenderQualityPin.ts
// 把歌词画布的分辨率与抗锯齿钉在一组固定值上（视频导出用）。不在它里面时什么也不钉。
// @note Scopify 将全局挡位存在 useLyricStageStore，由歌词全局设置修改。

export const LyricRenderQualityPinContext = createContext<LyricRenderQuality | null>(null);

/** 钉住的那一组（导出时），没钉时是 null。 */
export const useLyricRenderQualityPin = (): LyricRenderQuality | null =>
  useContext(LyricRenderQualityPinContext);

/** 固定画质优先，否则读取已保存的全局画质。 */
export const useGlobalLyricRenderQuality = (): LyricRenderQuality => {
  const pinned = useLyricRenderQualityPin();
  const saved = useLyricStageStore((state) => state.lyricRenderQuality);
  return pinned ?? saved;
};
