import type { CommandWorkspaceRootPage } from "@/types/commandWorkspace/model";

export const COMMAND_WORKSPACE_ROOT_PAGES = [
  {
    id: "search",
    label: "搜索",
    page: "search",
    summary: "查找歌曲、歌手、专辑、歌单、播客与声音",
  },
  {
    id: "now-playing",
    label: "正在播放",
    page: "now-playing",
    summary: "控制当前曲目、进度和音量",
  },
  { id: "queue", label: "播放队列", page: "queue", summary: "播放、调整与移除队列曲目" },
  {
    id: "theme",
    label: "外观与主题",
    page: "theme",
    summary: "切换浅色、深色、跟随系统与主题配色",
  },
  { id: "settings", label: "设置", page: "settings", summary: "应用、Folia 与桌面播放设置" },
  {
    id: "dynamic-island",
    label: "灵动岛设置",
    page: "dynamic-island",
    summary: "开关、换行动画、大小、翻译、吸附居中、非遮挡与置顶",
  },
] as const satisfies readonly {
  id: string;
  label: string;
  page: CommandWorkspaceRootPage;
  summary: string;
}[];
