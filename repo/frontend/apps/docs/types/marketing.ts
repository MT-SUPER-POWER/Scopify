import type { MotionValue } from "framer-motion";
import type { StaticImageData } from "next/image";

import type { AudioBands, Line } from "@folia/types";

export interface LandingFoliaTimeline {
  audioBands: AudioBands;
  audioPower: MotionValue<number>;
  currentLineIndex: number;
  currentTime: MotionValue<number>;
  lines: Line[];
}

/** 落地页中一张真实界面截图。 */
export interface LandingScreenshot {
  alt: string;
  src: StaticImageData;
}

/** “六个场景”中的单个使用场景。 */
export interface LandingDayMoment {
  feature: string;
  scene: string;
  screenshot: LandingScreenshot;
  sentence: string;
}

/** 与客户端「外观 → 精选主题」一致的背景渐变预设。 */
export interface LandingThemePreset {
  bottom: string;
  id: string;
  name: string;
  top: string;
}

export interface LandingVisualizerMode {
  label: string;
  value: string;
}

/** 歌词舞台上某种动画的「这一场」：唱的两句词和这一场的灯光颜色。 */
export interface LandingStageScene {
  /** 这一场的主色：声场配色与 Folia 歌词的高光都由它推出。 */
  accent: string;
  verse: readonly string[];
}

/** 声场着色器的四色调色板：底色、暗部、中间调与高光。 */
export type LandingPalette = readonly [base: string, deep: string, mid: string, glow: string];

export type LandingChapterId =
  "intro" | "verse" | "chorus" | "bridge" | "variation" | "echo" | "outro";

/** 落地页把整页当作一首歌：每个章节对应歌曲里的一段，并带着自己的声场配色。 */
export interface LandingChapter {
  id: LandingChapterId;
  /** 声场着色器在该章节的整体亮度，0–1。 */
  intensity: number;
  /** 英文乐段名，如 Verse。 */
  movement: string;
  palette: LandingPalette;
  title: string;
}

/** 「六个场景」内凹曲面轨道的几何；长度单位为 px，弧长坐标以初始视口中心为 0。 */
export interface LandingCurvedTrackLayout {
  cardCenters: readonly number[];
  cardHeight: number;
  cardWidth: number;
  introCenter: number;
  introWidth: number;
  perspective: number;
  radius: number;
  /** 每张卡片切成多少条竖向窄条，用来近似贴合曲面。 */
  stripCount: number;
  /** 纵向滚动的总行程，等于最后一张卡片居中时的弧长偏移。 */
  travel: number;
  viewportHeight: number;
}

/** 章节在整页中的真实位置，供迷你播放器绘制刻度与跳转。 */
export interface LandingChapterOffset {
  /** 章节起点在整页可滚动距离中的比例，0–1。 */
  fraction: number;
  id: LandingChapterId;
  /** 章节起点的页面滚动位置（px）：章节顶部，或章节用 `data-landing-chapter-anchor` 声明的锚点。 */
  top: number;
}

/** 声场着色器每帧要追赶的目标状态，由落地页氛围上下文维护。 */
export interface LandingAtmosphereTarget {
  intensity: number;
  palette: LandingPalette;
  /** 歌词舞台的追光亮度，0 为关灯、1 为全亮。 */
  spotlight: number;
}

export interface LandingAtmosphereValue {
  activeChapter: LandingChapterId;
  setSpotlight: (spotlight: number) => void;
  /** 歌词舞台当前这一场的配色；只在「主歌」章节生效，传 null 恢复章节配色。 */
  setStagePalette: (palette: LandingPalette | null) => void;
  setThemePalette: (palette: LandingPalette | null) => void;
  targetRef: { readonly current: LandingAtmosphereTarget };
}

/** 声场渲染器单帧需要的全部 uniform 输入，颜色为线性 0–1 RGB。 */
export interface SoundFieldFrame {
  drift: number;
  intensity: number;
  palette: Float32Array;
  pointer: readonly [number, number];
  spotlight: number;
  time: number;
}

export interface SoundFieldRenderer {
  dispose: () => void;
  render: (frame: SoundFieldFrame) => void;
  resize: (width: number, height: number) => void;
}

/** 播放栏音质选择器中的一档。 */
export interface LandingQualityTier {
  label: string;
  spec: string;
}

/** 十段均衡器的一个预设，`gains` 与 `LANDING_EQ_BANDS` 一一对应，单位 dB。 */
export interface LandingEqPreset {
  gains: readonly number[];
  id: string;
  name: string;
}

/** 从真实截图里裁出的一张专辑封面（像素坐标基于原图）。 */
export interface LandingCoverCrop {
  size: number;
  x: number;
  y: number;
}
