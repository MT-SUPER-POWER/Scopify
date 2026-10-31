import { afterEach, expect, mock, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { i18n } from "@/lib/i18n";
import { ApiError } from "@/lib/web/apiError";
import type { NeteasePlaylist } from "@/types/playlist/api";
import type { SidebarSortablePlaylistsProps } from "@/types/sidebar/components";

let loggedIn = true;
const initial = {
  error: null as Error | null,
  refreshError: null as Error | null,
  isLoading: false,
  isPaused: false,
  isFetching: false,
  playlists: undefined as NeteasePlaylist[] | undefined,
  reload: async () => {},
};
let state = { ...initial };
mock.module("@/hooks/auth/useLoginStatus", () => ({ useLoginStatus: () => loggedIn }));
mock.module("@/hooks/sidebar/useSidebarPlaylists", () => ({ useSidebarPlaylists: () => state }));
mock.module("@/components/Sidebar/SidebarSortablePlaylists", () => ({
  SidebarSortablePlaylists: ({ playlists }: SidebarSortablePlaylistsProps) => (
    <div data-testid="saved-playlists">{playlists.length} saved playlists</div>
  ),
}));
const { SidebarPlaylistLibraryContent } =
  await import("@/components/Sidebar/SidebarPlaylistLibraryContent");
const { SidebarPlaylistFailure } = await import("@/components/Sidebar/SidebarPlaylistFailure");
void i18n.changeLanguage("zh-CN");

function render(collapsed = false) {
  return renderToStaticMarkup(
    <SidebarPlaylistLibraryContent
      isCollapsed={collapsed}
      onLogin={() => {}}
      onCreate={() => {}}
    />,
  );
}

afterEach(() => {
  loggedIn = true;
  state = { ...initial };
});

test("signed-out users get a login state in expanded and collapsed sidebars", () => {
  loggedIn = false;
  expect(render()).toContain("登录后查看你的歌单");
  expect(render(true)).toContain('aria-label="登录后查看你的歌单 · 登录"');
});

test("initial loading and offline waiting are distinct from a successful empty library", () => {
  state.isLoading = true;
  expect(render()).toContain('aria-label="正在加载歌单"');
  state.isLoading = false;
  state.isPaused = true;
  expect(render()).toContain("等待网络连接");
  expect(render(true)).toContain("网络恢复后会自动加载你的歌单");
  state.isPaused = false;
  state.playlists = [];
  expect(render()).toContain("你还没有任何歌单");
  expect(render()).toContain("创建歌单");
});

test("first-load errors reach the shared boundary instead of appearing as an empty library", () => {
  state.error = new ApiError({ kind: "network", message: "offline" });
  expect(() => render()).toThrow("offline");
  const fallback = renderToStaticMarkup(
    <SidebarPlaylistFailure error={state.error} onRetry={() => {}} isCollapsed />,
  );
  expect(fallback).toContain('aria-label="加载歌单失败 · 重试"');
});

test("background errors and refreshes retain cached playlist rows", () => {
  state.playlists = [{} as NeteasePlaylist];
  state.refreshError = new ApiError({ kind: "timeout", message: "timed out" });
  expect(render()).toContain("1 saved playlists");
  expect(render()).toContain("更新失败，已保留歌单");
  state.isFetching = true;
  expect(render()).toContain("1 saved playlists");
  expect(render()).toContain("正在更新歌单");
});
