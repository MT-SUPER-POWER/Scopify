import type { Line as FoliaLine } from "@/components/lyrics/folia/src/types";

export type {
  DynamicIslandCommand,
  DynamicIslandMode,
  DynamicIslandPreferences,
  DynamicIslandPreferencesUpdate,
  DynamicIslandTransition,
} from "@scopify/desktop-contract";

export interface DynamicIslandMetrics {
  rowHeight: number;
  paddingX: number;
  gap: number;
  coverSize: number;
  coverRadius: number;
  fontSize: number;
  subFontSize: number;
  subRowHeight: number;
  /** 吸附态下方圆角半径。 */
  snapRadius: number;
}

/** 灵动岛一次展示的内容；key 变化即视为换行，触发收放动画。 */
export interface DynamicIslandContent {
  key: string;
  main: string;
  sub: string;
  /** 保留展示行身份，收缩期间仍由文本组件采样旧行进度。 */
  progressLine?: FoliaLine;
}
