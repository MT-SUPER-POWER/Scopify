"use client";

import { usePlaybackCommands } from "@/hooks/player/usePlaybackCommands";
import { usePlaybackProjection } from "@/hooks/player/usePlaybackProjection";
import { useUiStore } from "@/store/module/ui";

/**
 * 右侧面板封面位的 MV：打开时暂停歌曲并记下原先是否在播放，
 * 看完或返回封面时据此恢复；切歌后选择自然失效（按歌曲 id 匹配）。
 */
export function useNowPlayingMv(songId: number) {
  const playback = usePlaybackProjection();
  const commands = usePlaybackCommands();
  const selection = useUiStore((s) => s.nowPlayingMv);
  const activeMvId = selection?.songId === songId ? selection.mvId : null;

  const open = (mvId: number) => {
    const current = useUiStore.getState().nowPlayingMv;
    const resumeSong = current?.songId === songId ? current.resumeSong : playback.isPlaying;
    if (playback.isPlaying) void commands.pause();
    useUiStore.getState().setNowPlayingMv({ songId, mvId, resumeSong });
  };

  /** resume 为 false 时只收起 MV，例如用户已经从播放栏继续放歌。 */
  const close = (resume = true) => {
    const current = useUiStore.getState().nowPlayingMv;
    if (resume && current?.songId === songId && current.resumeSong) void commands.play();
    useUiStore.getState().setNowPlayingMv(null);
  };

  return { activeMvId, open, close };
}
