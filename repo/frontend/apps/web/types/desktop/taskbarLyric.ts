import type { SubtitlePlayback } from "@/types/lyrics/subtitlePreview";
import type { Line as FoliaLine } from "@/components/lyrics/folia/src/types";

export type {
  TaskbarLyricColorMode,
  TaskbarLyricCommand,
  TaskbarLyricLayout,
  TaskbarLyricPosition,
  TaskbarLyricPreferences,
  TaskbarLyricPreferencesUpdate,
} from "@scopify/desktop-contract";

export interface TaskbarLyricItem {
  /** key 变化时整行做上滚切换。 */
  key: string;
  role: "primary" | "secondary";
  text: string;
  progressLine?: FoliaLine;
}

export interface TaskbarLyricLineProps {
  item: TaskbarLyricItem;
  fontSize: number;
  align: "left" | "right";
  /** 主行超长时按本句播放进度横向滚动。 */
  playback?: SubtitlePlayback;
  lineDurationMs?: number;
}

export interface TaskbarLyricControlsProps {
  visible: boolean;
}

export interface TaskbarLyricContentWidthOptions {
  items: TaskbarLyricItem[];
  fontSize: number;
  showCover: boolean;
  hovered: boolean;
  /** 主进程给出的可用宽度；尚未收到布局时为 null。 */
  maxWidth: number | null;
}
