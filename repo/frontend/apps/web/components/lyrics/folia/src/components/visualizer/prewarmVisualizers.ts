import { useLyricStageStore } from "@/store/module/lyrics";
import {
  VISUALIZER_REGISTRY,
  getVisualizerRegistryEntry,
  type VisualizerRegistryEntry,
} from "./registry";

// src/components/visualizer/prewarmVisualizers.ts
// 让启动慢的歌词样式提前准备（entry 的 `prewarm`，definition.ts；比如雾笺在后台先编着色器）。
// 由主窗口在页面空闲时调一次（components/lyrics/stage/FoliaVisualizerPrewarm.tsx）：保存的样式先准备，
// 声明了 `prewarmWhenIdle` 的其他样式随后准备，第一次切过去时就不用现编。

const run = (entry: VisualizerRegistryEntry) => {
  try {
    entry.prewarm?.();
  } catch (error) {
    console.warn(`[Visualizer] prewarm of ${entry.mode} failed`, error);
  }
};

/** 保存的样式先准备，再准备别的声明了 `prewarmWhenIdle` 的样式；每个样式各调一次。 */
export const prewarmVisualizers = (): void => {
  const saved = useLyricStageStore.getState().mode;
  const savedEntry = getVisualizerRegistryEntry(saved);
  // 存着的模式没注册时注册表退回默认样式：那不是保存的样式，不替它准备
  if (savedEntry.mode === saved) run(savedEntry);
  for (const entry of VISUALIZER_REGISTRY) {
    if (entry.prewarmWhenIdle && entry.mode !== saved) run(entry);
  }
};
