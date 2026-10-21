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
  /** 逐字填充进度，仅歌词行有。 */
  progress?: number[];
}
