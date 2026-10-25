"use client";

import { useCoverThemeColor } from "@/hooks/playlist/useCoverThemeColor";
import { getSizedImageUrl } from "@/lib/music/imageUrl";
import { resolveCoverUrl } from "@/lib/music/resolveCoverUrl";
import type { SongDetail } from "@/types/api/music";

/**
 * 当前歌曲封面的主色，压暗后作为右侧面板歌词卡、封面渐变的底色，保证其上的白字可读。
 * 主色未取到时返回 null，调用方回退到主题色。
 */
export function useNowPlayingTint(song: SongDetail) {
  const artworkUrl = resolveCoverUrl(song.al?.picUrl, song.al?.coverUrl);
  const color = useCoverThemeColor(artworkUrl ? getSizedImageUrl(artworkUrl, 100) : null);
  return color ? `color-mix(in oklab, ${color} 55%, black)` : null;
}
