/** 吸附在屏幕顶边（下方圆角）或自由悬浮（胶囊）。 */
export type DynamicIslandMode = "floating" | "snapped";

/** bounce：先收再弹开；smooth：直接朝新宽度过渡、歌词向上翻页。 */
export type DynamicIslandTransition = "bounce" | "smooth";

export interface DynamicIslandPreferences {
  alwaysOnTop: boolean;
  enabled?: boolean;
  /** 非遮挡：整窗鼠标穿透，悬停时淡出让出下方内容。 */
  nonOcclusive: boolean;
  /** 主行高度的缩放倍数。 */
  scale: number;
  showTranslation: boolean;
  /** 吸附到顶边时水平居中，而不是停在拖到的位置。 */
  snapCentered: boolean;
  transition: DynamicIslandTransition;
}

export type DynamicIslandPreferencesUpdate = Partial<DynamicIslandPreferences>;

export type DynamicIslandCommand =
  | { height: number; type: "set-dynamic-island-height" }
  /** 透明窗口内胶囊的实际宽度：用于裁切命中区域与悬停判定。 */
  | { type: "set-dynamic-island-shape"; width: number }
  | { type: "move-dynamic-island-window"; x: number; y: number }
  | { type: "save-dynamic-island-window" };
