"use client";

import dynamic from "next/dynamic";

import { LANDING_FOLIA_THEME } from "@/constants/marketing";
import type { LandingFoliaTimeline } from "@/types/marketing";

const FoliaVisualizer = dynamic(
  () => import("@folia/components/visualizer/VisualizerRenderer").then((module) => module.default),
  { ssr: false },
);

interface FoliaVisualizerRendererProps {
  coverUrl: string;
  lyricsFontScale?: number;
  mode: string;
  reducedMotion: boolean;
  showText: boolean;
  timeline: LandingFoliaTimeline;
}

/**
 * 与客户端共用 Folia 的歌词动画注册表，按 `mode` 渲染任意一种动画。
 *
 * 落地页上的动画只供观看：莫奈、时计等模式会接管歌词列上的滚轮与触摸（`preventDefault`
 * 加 `touch-action: none`）用来手动翻歌词，放在页面里就会吞掉整页滚动、让人卡在这一种动画上。
 * `inert` 把整棵子树移出命中测试（连子元素自己声明的 `pointer-events: auto` 也一并失效），
 * 滚轮和触摸于是直接落到页面上。
 */
export function FoliaVisualizerRenderer({
  coverUrl,
  lyricsFontScale = 0.84,
  mode,
  reducedMotion,
  showText,
  timeline,
}: FoliaVisualizerRendererProps) {
  return (
    <div inert className="absolute inset-0 overflow-hidden" data-folia-landing-mode={mode}>
      <FoliaVisualizer
        mode={mode}
        currentTime={timeline.currentTime}
        currentLineIndex={timeline.currentLineIndex}
        lines={timeline.lines}
        theme={LANDING_FOLIA_THEME}
        audioPower={timeline.audioPower}
        audioBands={timeline.audioBands}
        background={{ transparent: true }}
        coverUrl={coverUrl}
        seed={`scopify-landing-${mode}`}
        showText={showText}
        paused={reducedMotion}
        staticMode={reducedMotion}
        isPreviewMode
        isPlayerChromeHidden
        hideTranslationSubtitle
        showSubtitleTranslation={false}
        subtitleContentMode="none"
        lyricsFontScale={lyricsFontScale}
        songTitle="Scopify"
        songArtist="Folia"
      />
    </div>
  );
}
