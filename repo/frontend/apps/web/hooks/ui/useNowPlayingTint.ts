"use client";

import { useCoverThemeColor } from "@/hooks/playlist/useCoverThemeColor";
import { getSizedImageUrl } from "@/lib/music/imageUrl";

/**
 * 当前歌曲封面主色与主题卡片底色混合，让歌词卡在亮色与暗色界面保持相应的明度。
 * 主色未取到时返回 null，调用方回退到主题色。
 */
export function useNowPlayingTint(artworkUrl: string | null | undefined) {
  const color = useCoverThemeColor(artworkUrl ? getSizedImageUrl(artworkUrl, 100) : null);
  return color ? `color-mix(in oklab, ${color} 25%, var(--card))` : null;
}
