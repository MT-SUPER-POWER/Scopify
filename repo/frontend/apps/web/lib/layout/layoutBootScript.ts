import {
  DASHBOARD_LAYOUT_GROUP_ID,
  DASHBOARD_PANEL_IDS,
  NOW_PLAYING_PANEL_MEDIA_QUERY,
  SIDEBAR_COLLAPSED_WIDTH,
} from "@/constants/layout";
import { DESKTOP_RUNTIME_PROBE_EXPRESSION } from "@/lib/runtime";
import { MUSIC_SESSION_STORAGE_KEY } from "@/lib/web/musicSessionCredential";

const UI_STORAGE_KEY = "ui-storage";

/**
 * 首帧前同步执行的内联脚本：把本地保存的布局状态写到 <html> 上，供加载骨架用 CSS 直接读取。
 * 骨架在服务端/静态 HTML 中渲染，此时拿不到 localStorage；水合期间 React 也沿用服务端值，
 * 若改由 JS 计算，首屏只能显示默认布局。写入内容：
 * - `--boot-sidebar-width`：侧边栏宽度（折叠时为图标栏宽度）
 * - `data-boot-now-playing`：右栏形态 panel / rail / none
 * - `--boot-now-playing-width`：右栏展开时的宽度
 * - `data-boot-session`：是否已登录（决定是否显示歌单骨架）
 * - `data-boot-desktop`：是否运行在桌面端（preload 早于页面脚本注入桥接对象）
 */
export function createLayoutBootScript() {
  const config = JSON.stringify({
    collapsedWidth: SIDEBAR_COLLAPSED_WIDTH,
    ids: DASHBOARD_PANEL_IDS,
    layoutPrefix: `react-resizable-panels:${DASHBOARD_LAYOUT_GROUP_ID}`,
    media: NOW_PLAYING_PANEL_MEDIA_QUERY,
    sessionKey: MUSIC_SESSION_STORAGE_KEY,
    uiKey: UI_STORAGE_KEY,
  });

  return `(function(c){try{
var d=document.documentElement,s=window.localStorage;
function read(k){try{return JSON.parse(s.getItem(k)||"null")}catch(e){return null}}
var ui=(read(c.uiKey)||{}).state||{};
var np=window.matchMedia(c.media).matches?(ui.isNowPlayingPanelOpen===false?"rail":"panel"):"none";
var ids=[c.ids.sidebar,c.ids.main];if(np!=="none")ids.push(c.ids.nowPlaying);
var layout=read([c.layoutPrefix].concat(ids).join(":"))||{};
var sidebar=ui.isCollapsed?c.collapsedWidth+"px":layout[c.ids.sidebar]>0?layout[c.ids.sidebar]+"%":"";
if(sidebar)d.style.setProperty("--boot-sidebar-width",sidebar);
if(np==="panel"&&layout[c.ids.nowPlaying]>0)d.style.setProperty("--boot-now-playing-width",layout[c.ids.nowPlaying]+"%");
d.setAttribute("data-boot-now-playing",np);
if(${DESKTOP_RUNTIME_PROBE_EXPRESSION})d.setAttribute("data-boot-desktop","true");
if((s.getItem(c.sessionKey)||"").trim())d.setAttribute("data-boot-session","true");
}catch(e){}})(${config});`;
}
