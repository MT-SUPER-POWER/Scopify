import type { DynamicIslandPreferences } from "@/types/dynamicIsland";

/** 偏好从主进程读回之前的占位值，与主进程默认值保持一致。 */
export const DEFAULT_DYNAMIC_ISLAND_PREFERENCES: DynamicIslandPreferences = {
  alwaysOnTop: true,
  nonOcclusive: false,
  scale: 1,
  showTranslation: false,
  snapCentered: true,
  transition: "bounce",
};

/** 灵动岛缩放档位，需落在主进程允许的 0.8~2 之间。 */
export const DYNAMIC_ISLAND_SCALE_OPTIONS = [0.8, 0.9, 1, 1.2, 1.5, 2] as const;
