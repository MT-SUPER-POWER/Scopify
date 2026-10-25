/** 主内容区内吸顶元素的顶部偏移；顶栏已移出主内容区，不再需要让出空间。 */
export const DASHBOARD_MAIN_STICKY_TOP = 0;

/** Resizable dashboard layout id; react-resizable-panels persists it under `react-resizable-panels:<id>`. */
export const DASHBOARD_LAYOUT_GROUP_ID = "music-player-layout";
/** Sidebar panel width (percent of the dashboard) before the user resizes it. */
export const SIDEBAR_DEFAULT_SIZE_PERCENT = 18;

/** Panel ids inside the dashboard group; persisted layouts are keyed by the rendered id set. */
export const DASHBOARD_PANEL_IDS = {
  sidebar: "sidebar",
  main: "main",
  nowPlaying: "now-playing",
} as const;
/** Now Playing panel width (percent of the dashboard) before the user resizes it. */
export const NOW_PLAYING_PANEL_DEFAULT_SIZE_PERCENT = 22;
/** Now Playing panel pixel bounds; keeps the cover and artist card legible. */
export const NOW_PLAYING_PANEL_MIN_WIDTH = 280;
export const NOW_PLAYING_PANEL_MAX_WIDTH = 480;
/** Below this viewport width the Now Playing panel steps aside without changing the user's choice. */
export const NOW_PLAYING_PANEL_MEDIA_QUERY = "(min-width: 1100px)";
