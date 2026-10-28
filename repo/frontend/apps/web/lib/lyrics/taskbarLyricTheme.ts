import type { TaskbarLyricColorMode } from "@/types/desktop/taskbarLyric";

const LIGHT_TEXT = {
  primary: "#ffffff",
  secondary: "rgb(255 255 255 / 50%)",
  hover: "rgb(255 255 255 / 12%)",
};
const DARK_TEXT = {
  primary: "#1a1a1a",
  secondary: "rgb(0 0 0 / 62%)",
  hover: "rgb(0 0 0 / 8%)",
};

/**
 * 解析任务栏歌词的文字配色。colorMode 的 light/dark 指任务栏底色：
 * 浅色任务栏配深色文字，深色任务栏配浅色文字；taskbar 系列跟随系统任务栏深浅。
 */
export function resolveTaskbarLyricTheme(mode: TaskbarLyricColorMode, taskbarIsLight: boolean) {
  const lightBackground =
    mode === "light" ||
    (mode === "taskbar" && taskbarIsLight) ||
    (mode === "taskbarInverse" && !taskbarIsLight);
  return lightBackground ? DARK_TEXT : LIGHT_TEXT;
}
