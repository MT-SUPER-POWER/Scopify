/** 歌词放在任务栏图标的哪一侧；auto 按任务栏是否居中自动挑选更宽的一侧。 */
export type TaskbarLyricPosition = "auto" | "left" | "right";

/** taskbar 跟随任务栏深浅色，taskbarInverse 取反，light/dark 固定。 */
export type TaskbarLyricColorMode = "dark" | "light" | "taskbar" | "taskbarInverse";

export interface TaskbarLyricPreferences {
  /** 只让歌词实际占用的宽度参与命中，空白处点击落回任务栏。 */
  autoAdjustOccupiedSpace: boolean;
  /** 占满任务栏可用空间；关闭后按 maxWidth 限宽。 */
  autoMaxWidth: boolean;
  colorMode: TaskbarLyricColorMode;
  /** 主行下方显示翻译或下一句。 */
  doubleLine: boolean;
  enabled?: boolean;
  fontSize: number;
  leftMargin: number;
  maxWidth: number;
  position: TaskbarLyricPosition;
  rightMargin: number;
  showBackground: boolean;
  showCover: boolean;
  showTranslation: boolean;
  /** 仅 Windows 且原生模块可用时为 true，由主进程填写。 */
  supported?: boolean;
}

export type TaskbarLyricPreferencesUpdate = Partial<Omit<TaskbarLyricPreferences, "supported">>;

export interface TaskbarLyricLayout {
  /** 歌词贴向哪一侧对齐。 */
  anchor: "left" | "right";
  isCentered: boolean;
  /** 任务栏是否为浅色主题。 */
  isLight: boolean;
  /** 窗口可用的最大宽度（DIP）。 */
  maxWidth: number;
  systemType: "win10" | "win11";
}

export type TaskbarLyricCommand = { type: "set-taskbar-lyric-content-width"; width: number };
