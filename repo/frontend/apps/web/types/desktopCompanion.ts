import type { PlaybackTrack } from "@scopify/desktop-contract";
import type { Line as FoliaLine } from "@/components/lyrics/folia/src/types";

export interface CompanionWindowDragOptions {
  /** 锁定等状态下不响应拖拽。 */
  disabled: boolean;
  /** 命中这些元素时不开始拖拽，默认排除按钮、链接与输入框。 */
  ignoreSelector?: string;
  /** 拖拽中按屏幕坐标移动窗口左上角。 */
  onMove: (x: number, y: number) => void;
  /** 松手后持久化位置。 */
  onEnd: () => void;
}

/** 伴随窗口共用的歌词快照，由 useCompanionLyricLine 产出。 */
export interface CompanionLyricSnapshot {
  activeLine: FoliaLine | null;
  fillProgress?: number[];
  index: number;
  isInterlude: boolean;
  nextLine: FoliaLine | null;
  track: PlaybackTrack | null;
}

export interface CompanionLyricTextProps {
  text: string;
  /** 每个字素的填充进度（0~1）；缺省时整行按已唱颜色显示。 */
  progress?: number[];
}

/** 偏好对象里取值为布尔的键，用于生成开关行。 */
export type BooleanKeys<T> = {
  [K in keyof T]-?: T[K] extends boolean | undefined ? K : never;
}[keyof T];
