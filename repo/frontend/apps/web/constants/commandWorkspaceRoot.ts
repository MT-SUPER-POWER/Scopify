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

/** 工作区页面的同义词：简繁、英文与页面里能调的具体项，帮助模糊搜索命中。 */
export const COMMAND_WORKSPACE_ROOT_PAGE_KEYWORDS: Partial<
  Record<CommandWorkspaceRootPage, string>
> = {
  search: "搜索 搜尋 查找 找歌 歌曲 歌手 专辑 歌单 search find",
  "now-playing": "正在播放 当前 當前 进度 音量 控制 now playing current volume progress",
  queue: "队列 隊列 播放列表 下一首 待播 queue up next playlist",
  theme:
    "外观 主题 主题色 配色 暗色 深色 亮色 浅色 跟随系统 模式 theme dark light system color appearance",
  settings: "设置 設定 偏好 选项 settings preferences options",
  "dynamic-island":
    "灵动岛 靈動島 dynamic island 开关 动画 回弹 平滑 大小 缩放 翻译 吸附 居中 非遮挡 穿透 置顶",
};
