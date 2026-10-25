import type { DynamicIslandPreferences } from "@/types/dynamicIsland";
import type { TaskbarLyricPreferences } from "@/types/taskbarLyric";

/** 偏好从主进程读回之前的占位值，与主进程默认值保持一致。 */
export const DEFAULT_DYNAMIC_ISLAND_PREFERENCES: DynamicIslandPreferences = {
  alwaysOnTop: true,
  nonOcclusive: false,
  scale: 1,
  showTranslation: false,
  snapCentered: true,
  transition: "smooth",
};

export const DEFAULT_TASKBAR_LYRIC_PREFERENCES: TaskbarLyricPreferences = {
  autoAdjustOccupiedSpace: false,
  autoMaxWidth: true,
  colorMode: "taskbar",
  doubleLine: true,
  fontSize: 14,
  leftMargin: 0,
  maxWidth: 400,
  position: "auto",
  rightMargin: 0,
  showBackground: false,
  showCover: true,
  showTranslation: true,
};

/** 灵动岛缩放档位，需落在主进程允许的 0.8~2 之间。 */
export const DYNAMIC_ISLAND_SCALE_OPTIONS = [0.8, 0.9, 1, 1.2, 1.5, 2] as const;
/** 任务栏歌词字号档位。 */
export const TASKBAR_LYRIC_FONT_SIZE_OPTIONS = [11, 12, 13, 14, 15, 16, 18, 20] as const;
