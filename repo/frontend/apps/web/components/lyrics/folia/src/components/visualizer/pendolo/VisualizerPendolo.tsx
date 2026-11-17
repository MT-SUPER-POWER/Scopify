import React, { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { motion, useSpring, useTransform } from "framer-motion";
import { Star, type LucideIcon } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { DEFAULT_PENDOLO_TUNING, type Line } from "@/components/lyrics/folia/src/types";
import { colorWithAlpha } from "@/components/lyrics/folia/src/components/visualizer/colorMix";
import { type VisualizerSharedProps } from "@/components/lyrics/folia/src/components/visualizer/definition";
import VisualizerShell from "@/components/lyrics/folia/src/components/visualizer/VisualizerShell";
import PendoloClockworkCanvas from "@/components/lyrics/folia/src/components/visualizer/pendolo/PendoloClockworkCanvas";
import {
  resolveThemeFontStack,
  resolveThemeTranslationFontStack,
} from "@/components/lyrics/folia/src/utils/fontStacks";
import { calculatePendoloWheelLayout, resolvePendoloWheelCenterX } from "./pendoloGeometry";
import {
  buildPendoloDialProjection,
  buildPendoloHubViewProjection,
  buildPendoloLayerProjection,
  buildPendoloTiltProjection,
  resolvePendoloPlaneCssTransform,
  resolvePendoloSpaceCssTransform,
} from "./pendoloDialProjection";
import { PENDOLO_BALANCE_ICON_HEIGHT, PENDOLO_LYRIC_LAYER_HEIGHT } from "./pendoloParallax";
import type { PendoloStandUp } from "@/types/lyrics/folia/pendoloClockwork";
import PendoloRotatingLine from "./PendoloRotatingLine";
import { resolveLyricAntialias } from "../../../utils/lyricRenderQuality";
import { useLyricRenderQuality } from "../renderQuality/useLyricRenderQuality";
import PendoloActiveLyricSweep from "@/components/lyrics/folia/src/components/visualizer/pendolo/PendoloActiveLyricSweep";
import { buildPendoloTextLayout } from "@/components/lyrics/folia/src/components/visualizer/pendolo/pendoloTextLayout";
import {
  resolvePendoloSubtitleTracks,
  sumPendoloSubtitleTrackHeights,
} from "@/components/lyrics/folia/src/components/visualizer/pendolo/pendoloSubtitleTracks";
import { resolveSubtitleContentMode } from "@/components/lyrics/folia/src/utils/lyrics/alternateText";
import {
  resolvePendoloChorusPresentation,
  resolvePendoloMotionProfile,
} from "@/components/lyrics/folia/src/components/visualizer/pendolo/pendoloMotionProfile";

const PENDOLO_SCROLL_IDLE_RESET_MS = 2500;
const PENDOLO_SCROLL_STEP_PX = 90;
const PENDOLO_TOUCH_STEP_PX = 60;
const PENDOLO_SCROLL_EVENT_OPTIONS = { passive: false } as const;

const READY_GRACE_MS = 3000;
const INSTRUMENTAL_COMMIT_SECONDS = 2;
const INSTRUMENTAL_SECONDS_PER_FRAME = 5;

const getScrollDirection = (delta: number) => {
  if (Math.abs(delta) < 1) return 0;
  return delta > 0 ? 1 : -1;
};

const clampScrollSteps = (steps: number) => {
  if (Math.abs(steps) > 5) return steps > 0 ? 5 : -5;
  return steps;
};

// src/components/visualizer/pendolo/VisualizerPendolo.tsx

/**
 * VisualizerPendolo: Escapement wheel & pendulum clockwork lyric visualizer.
 * Renders lyrics arranged in an adjustable circular arc on the left side of the screen.
 * Advance of song lines triggers a springy mechanical escapement ratchet step and subtle balance wheel motion.
 */
/** Keep neighbouring lyrics legible behind the focal line in hub view. */
const PENDOLO_STAND_SIDE_LINE_ALPHA_MIN = 0.18;
const PENDOLO_STAND_SIDE_LINE_FULL_DISTANCE = 4;
const resolvePendoloStandSideLineAlpha = (distance: number) =>
  Math.min(
    1,
    // 间奏时没有焦点句，最近的两句离刻度针只有半档：按紧挨着的一句算，不再往下压
    PENDOLO_STAND_SIDE_LINE_ALPHA_MIN +
      ((1 - PENDOLO_STAND_SIDE_LINE_ALPHA_MIN) * (Math.max(1, distance) - 1)) /
        (PENDOLO_STAND_SIDE_LINE_FULL_DISTANCE - 1),
  );

const VisualizerPendolo: React.FC<VisualizerSharedProps> = (props) => {
  const {
    currentTime,
    currentLineIndex,
    lines,
    theme,
    audioBands,
    audioPower,
    showText = true,
    showSubtitleTranslation = true,
    pendoloTuning = DEFAULT_PENDOLO_TUNING,
    onLyricLineSeek,
    lyricsFontScale = 1,
    subtitleTheme,
    hideTranslationSubtitle = false,
    subtitleContentMode,
    isPreviewMode,
  } = props;
  const renderQuality = useLyricRenderQuality(pendoloTuning.render, isPreviewMode);
  // Pendolo lays its subtitles out inside the clockwork layout, not the shared bottom overlay;
  // 'both' stacks romanization above translation under each lyric (Folia 5809e8e8). The rows come
  // from resolvePendoloSubtitleTracks, which the height pre-measurement and the rendering both
  // read, so the reserved space always matches the drawn rows.
  const resolvedSubtitleMode = resolveSubtitleContentMode(
    subtitleContentMode,
    showSubtitleTranslation,
  );

  const [viewportSize, setViewportSize] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : 1920,
    height: typeof window !== "undefined" ? window.innerHeight : 1080,
  });
  const visualizerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const element = visualizerRef.current;
    if (!element) return;

    const updateViewportSize = () => {
      const width = Math.round(element.clientWidth);
      const height = Math.round(element.clientHeight);
      if (width === 0 || height === 0) return;
      setViewportSize((previous) =>
        previous.width === width && previous.height === height ? previous : { width, height },
      );
    };

    updateViewportSize();
    const observer = new ResizeObserver(updateViewportSize);
    observer.observe(element);
    return () => {
      observer.disconnect();
    };
  }, []);

  const lastValidLineIndexRef = React.useRef<number>(0);
  if (currentLineIndex >= 0 && currentLineIndex < lines.length) {
    lastValidLineIndexRef.current = currentLineIndex;
  }

  const wheelRailRef = useRef<HTMLDivElement | null>(null);
  const [manualScrollAnchorIndex, setManualScrollAnchorIndex] = useState<number | null>(null);
  const manualScrollResetRef = useRef<number | null>(null);
  const wheelAccumulatorRef = useRef(0);
  const wheelDirectionRef = useRef(0);
  const touchLastYRef = useRef<number | null>(null);
  const touchAccumulatorRef = useRef(0);
  const touchDirectionRef = useRef(0);

  const getFallbackAnchorIndex = useCallback(() => {
    if (manualScrollAnchorIndex !== null) return manualScrollAnchorIndex;
    if (currentLineIndex >= 0 && currentLineIndex < lines.length) return currentLineIndex;
    const currentTimeVal = currentTime.get();
    if (lastValidLineIndexRef.current === 0 && currentTimeVal < (lines[0]?.startTime ?? 0))
      return -1;
    return lastValidLineIndexRef.current + 0.5;
  }, [currentLineIndex, currentTime, lines, manualScrollAnchorIndex]);

  const [isInstrumental, setIsInstrumental] = useState(false);
  const lyricsSig = lines.length === 0 ? "" : `${lines.length}|${lines[0]?.fullText ?? ""}`;
  const seedRef = useRef(props.seed);

  useEffect(() => {
    if (lyricsSig !== "") {
      setIsInstrumental(false);
      seedRef.current = props.seed;
      return undefined;
    }
    if (props.seed !== seedRef.current) {
      setIsInstrumental(false);
      seedRef.current = props.seed;
    }

    let raf = 0;
    let sawReset = false;
    const startWall = performance.now();
    const watch = () => {
      const t = currentTime.get();
      const capped = performance.now() - startWall >= READY_GRACE_MS;
      if (!sawReset && t < 1) sawReset = true;
      if ((sawReset && t >= INSTRUMENTAL_COMMIT_SECONDS) || capped) {
        setIsInstrumental(true);
        return;
      }
      raf = requestAnimationFrame(watch);
    };
    raf = requestAnimationFrame(watch);
    return () => cancelAnimationFrame(raf);
  }, [props.seed, lyricsSig, currentTime]);

  const [instrumentalIndex, setInstrumentalIndex] = useState(0);
  const instrumentalIndexRef = useRef(0);

  useEffect(() => {
    if (!isInstrumental) return undefined;

    let raf = 0;
    const tick = () => {
      const t = currentTime.get();
      const idx = Math.floor(t / INSTRUMENTAL_SECONDS_PER_FRAME);
      if (idx !== instrumentalIndexRef.current) {
        instrumentalIndexRef.current = idx;
        setInstrumentalIndex(idx);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isInstrumental, currentTime]);

  const targetLineIndex = useMemo(() => {
    if (lines.length === 0) {
      return isInstrumental ? instrumentalIndex : 0;
    }
    return getFallbackAnchorIndex();
  }, [getFallbackAnchorIndex, lines.length, isInstrumental, instrumentalIndex]);

  const scheduleManualScrollReset = useCallback(() => {
    if (manualScrollResetRef.current !== null) {
      window.clearTimeout(manualScrollResetRef.current);
    }
    manualScrollResetRef.current = window.setTimeout(() => {
      setManualScrollAnchorIndex(null);
      wheelAccumulatorRef.current = 0;
      wheelDirectionRef.current = 0;
      touchAccumulatorRef.current = 0;
      touchDirectionRef.current = 0;
      manualScrollResetRef.current = null;
    }, PENDOLO_SCROLL_IDLE_RESET_MS);
  }, []);

  useEffect(
    () => () => {
      if (manualScrollResetRef.current !== null) {
        window.clearTimeout(manualScrollResetRef.current);
      }
    },
    [],
  );

  const moveManualScrollAnchor = useCallback(
    (steps: number) => {
      if (lines.length === 0) return;
      setManualScrollAnchorIndex((current) => {
        const baseIndex = current ?? getFallbackAnchorIndex();
        return Math.max(0, Math.min(lines.length - 1, Math.round(baseIndex + steps)));
      });
      scheduleManualScrollReset();
    },
    [getFallbackAnchorIndex, lines.length, scheduleManualScrollReset],
  );

  const handleRailWheel = useCallback(
    (event: WheelEvent) => {
      if (lines.length === 0) return;
      if (event.cancelable) event.preventDefault();
      event.stopPropagation();
      const direction = getScrollDirection(event.deltaY);
      if (
        direction !== 0 &&
        wheelDirectionRef.current !== 0 &&
        direction !== wheelDirectionRef.current
      ) {
        wheelAccumulatorRef.current = 0;
      }
      wheelDirectionRef.current = direction || wheelDirectionRef.current;
      wheelAccumulatorRef.current += event.deltaY;
      const steps = clampScrollSteps(
        Math.trunc(wheelAccumulatorRef.current / PENDOLO_SCROLL_STEP_PX),
      );
      if (steps !== 0) {
        wheelAccumulatorRef.current = 0;
        moveManualScrollAnchor(steps);
      } else {
        scheduleManualScrollReset();
      }
    },
    [lines.length, moveManualScrollAnchor, scheduleManualScrollReset],
  );

  const handleRailTouchStart = useCallback(
    (event: TouchEvent) => {
      if (lines.length === 0) return;
      event.stopPropagation();
      touchLastYRef.current = event.touches[0]?.clientY ?? null;
      touchAccumulatorRef.current = 0;
      touchDirectionRef.current = 0;
      setManualScrollAnchorIndex(getFallbackAnchorIndex());
      scheduleManualScrollReset();
    },
    [getFallbackAnchorIndex, lines.length, scheduleManualScrollReset],
  );

  const handleRailTouchMove = useCallback(
    (event: TouchEvent) => {
      if (lines.length === 0 || touchLastYRef.current === null) return;
      event.stopPropagation();
      const nextY = event.touches[0]?.clientY;
      if (typeof nextY !== "number") return;
      const deltaY = touchLastYRef.current - nextY;
      touchLastYRef.current = nextY;
      const direction = getScrollDirection(deltaY);
      if (
        direction !== 0 &&
        touchDirectionRef.current !== 0 &&
        direction !== touchDirectionRef.current
      ) {
        touchAccumulatorRef.current = 0;
      }
      touchDirectionRef.current = direction || touchDirectionRef.current;
      touchAccumulatorRef.current += deltaY;
      const steps = clampScrollSteps(
        Math.trunc(touchAccumulatorRef.current / PENDOLO_TOUCH_STEP_PX),
      );
      if (steps !== 0) {
        touchAccumulatorRef.current = 0;
        moveManualScrollAnchor(steps);
      } else {
        scheduleManualScrollReset();
      }
    },
    [lines.length, moveManualScrollAnchor, scheduleManualScrollReset],
  );

  const handleRailTouchEnd = useCallback(() => {
    touchLastYRef.current = null;
    touchDirectionRef.current = 0;
    touchAccumulatorRef.current = 0;
    scheduleManualScrollReset();
  }, [scheduleManualScrollReset]);

  useEffect(() => {
    const rail = wheelRailRef.current;
    if (!rail) return undefined;
    const wheelListener: EventListener = (event) => handleRailWheel(event as WheelEvent);
    const touchStartListener: EventListener = (event) => handleRailTouchStart(event as TouchEvent);
    const touchMoveListener: EventListener = (event) => handleRailTouchMove(event as TouchEvent);
    const touchEndListener: EventListener = () => handleRailTouchEnd();
    rail.addEventListener("wheel", wheelListener, PENDOLO_SCROLL_EVENT_OPTIONS);
    rail.addEventListener("touchstart", touchStartListener, PENDOLO_SCROLL_EVENT_OPTIONS);
    rail.addEventListener("touchmove", touchMoveListener, PENDOLO_SCROLL_EVENT_OPTIONS);
    rail.addEventListener("touchend", touchEndListener, PENDOLO_SCROLL_EVENT_OPTIONS);
    rail.addEventListener("touchcancel", touchEndListener, PENDOLO_SCROLL_EVENT_OPTIONS);
    return () => {
      rail.removeEventListener("wheel", wheelListener);
      rail.removeEventListener("touchstart", touchStartListener);
      rail.removeEventListener("touchmove", touchMoveListener);
      rail.removeEventListener("touchend", touchEndListener);
      rail.removeEventListener("touchcancel", touchEndListener);
    };
  }, [handleRailTouchEnd, handleRailTouchMove, handleRailTouchStart, handleRailWheel]);

  // Escapement spring motion for line transition tick
  const springSnappiness = pendoloTuning.tickSnappiness;
  const motionProfile = useMemo(
    () => resolvePendoloMotionProfile(theme.animationIntensity),
    [theme.animationIntensity],
  );
  const tickSpring = useSpring(targetLineIndex, {
    stiffness: 180 * springSnappiness * motionProfile.escapementSpringMultiplier,
    damping: (18 + 4 / Math.max(0.5, springSnappiness)) * motionProfile.escapementDampingMultiplier,
    mass: 0.8,
  });

  // Update target escapement spring when targetLineIndex updates
  useEffect(() => {
    tickSpring.set(targetLineIndex);
  }, [targetLineIndex, tickSpring]);

  // Font stack & weight setup
  const fontFamily = useMemo(() => resolveThemeFontStack(theme), [theme]);
  const fontWeight = 400;

  // 歌词左右镜像（#1124）：表盘在右、弧线朝左；关着时 sideSign 是 1，一切和原来一样
  const mirrored = pendoloTuning.mirrorLayout === true;
  const sideSign = mirrored ? -1 : 1;
  const centerX = resolvePendoloWheelCenterX(viewportSize.width, pendoloTuning);
  const centerY = viewportSize.height * pendoloTuning.wheelCenterY;
  const baseRadius = Math.min(viewportSize.width, viewportSize.height) * pendoloTuning.arcRadius;
  const lyricRadiusOffset = Math.min(viewportSize.width, viewportSize.height) * 0.06;
  const lyricRingRadius = baseRadius + lyricRadiusOffset;

  const outerEdge = mirrored ? centerX - baseRadius : centerX + baseRadius;
  const availableTextWidth = Math.max(
    140,
    Math.min(
      viewportSize.width * 0.46,
      (mirrored ? outerEdge : viewportSize.width - outerEdge) - 48,
    ),
  );
  // 表盘倾斜：歌词和摆轮图标放在一层里整体按倾斜投影（它们已经按镜像排过），表盘画布还要先镜像
  // Canvas2D 回退画不了透视，歌词层却是 matrix3d 透视加视差，两边会对不上：回退时整体不倾斜
  const [clockworkWebgl, setClockworkWebgl] = useState(true);
  const requestedTiltDeg = pendoloTuning.tiltDeg ?? 0;
  const tiltDeg = clockworkWebgl ? requestedTiltDeg : 0;
  const tiltAxisDeg = pendoloTuning.tiltAxisDeg ?? 0;
  // 轮心视角：相机在轮心后上方，顺着刻度针看向焦点句；代替倾斜，同样只在 WebGL 下生效
  const requestedHubView = pendoloTuning.hubView === true;
  const hubView = clockworkWebgl && requestedHubView;
  // 相机至少要比最高的一层（摆轮图标）高一截，不然那几层会跑到相机上面、从底下被看到
  const hubCameraHeightPx =
    baseRadius *
    Math.max(
      pendoloTuning.hubViewHeight ?? DEFAULT_PENDOLO_TUNING.hubViewHeight ?? 1.4,
      PENDOLO_BALANCE_ICON_HEIGHT * (pendoloTuning.parallaxDepth ?? 1) + 0.15,
    );
  // 相机从轮心沿刻度针反方向后退这么远，越过轮心看向焦点句，整套齿轮在近处
  const hubCameraBackPx = baseRadius * (pendoloTuning.hubViewBack ?? 1.2);
  const tiltProjection = useMemo(
    () =>
      hubView
        ? buildPendoloHubViewProjection(
            hubCameraHeightPx,
            hubCameraBackPx,
            lyricRingRadius,
            sideSign,
            centerX,
            centerY,
            viewportSize.width,
            viewportSize.height,
          )
        : buildPendoloTiltProjection(tiltDeg, tiltAxisDeg, viewportSize.width, viewportSize.height),
    [
      centerX,
      centerY,
      hubCameraBackPx,
      hubCameraHeightPx,
      hubView,
      lyricRingRadius,
      sideSign,
      tiltAxisDeg,
      tiltDeg,
      viewportSize.height,
      viewportSize.width,
    ],
  );
  const dialProjection = useMemo(
    () => buildPendoloDialProjection(tiltProjection, mirrored),
    [mirrored, tiltProjection],
  );

  // Escapement angular shift calculation
  const totalArcRad = (pendoloTuning.arcAngleDeg * Math.PI) / 180;
  const visibleWindowCount = 9;
  const angleStepRad = totalArcRad / Math.max(1, visibleWindowCount - 1);
  // Keep the ratchet interpolation out of React's render path. A line change is
  // discrete, but the spring emits many intermediate values while settling.
  const wheelRotationDeg = useTransform(
    tickSpring,
    (value) => -(value - targetLineIndex) * angleStepRad * (180 / Math.PI),
  );
  // 镜像时轨道反着转，弧线在屏幕上才和原版对称地走
  const railRotationDeg = useTransform(wheelRotationDeg, (value) => value * sideSign);
  const textRotationCorrectionDeg = useTransform(railRotationDeg, (value) => -value * 0.65);
  // 轮心视角下句子立起来：抵掉轨道的转角，字的横向朝相机的右手（布局里是 (0, sideSign)）
  const standUpRotationDeg = useTransform(railRotationDeg, (value) => sideSign * 90 - value);
  const gearRotationAngleRad = useTransform(tickSpring, (value) => value * angleStepRad);

  const lineBlockHeights = useMemo(() => {
    const measureWidth = availableTextWidth / pendoloTuning.activeScale;
    return lines.map((line, index) => {
      if (Math.abs(index - targetLineIndex) > 10) {
        return 0;
      }
      // Always pre-allocate space for the focal state to prevent overlapping when scaled up
      const fontPx = Math.round(28 * lyricsFontScale);
      const mainHeight = buildPendoloTextLayout(
        line.fullText,
        `${fontWeight} ${fontPx}px ${fontFamily}`,
        measureWidth,
        Math.round(fontPx * 1.2),
      ).height;

      // Focal-state rows, same as the main lyric above: reserve the largest size the line takes.
      const subtitleTracks = resolvePendoloSubtitleTracks(line, {
        mode: resolvedSubtitleMode,
        hidden: hideTranslationSubtitle,
        focal: true,
        fontScale: lyricsFontScale,
      });
      const subtitleFontFamily = resolveThemeTranslationFontStack(subtitleTheme ?? theme);
      const translationHeight = sumPendoloSubtitleTrackHeights(
        subtitleTracks,
        (track) =>
          buildPendoloTextLayout(
            track.text,
            `${track.fontWeight} ${track.fontPx}px ${subtitleFontFamily}`,
            measureWidth,
            track.lineHeightPx,
          ).height,
      );

      return (mainHeight + translationHeight) * pendoloTuning.activeScale;
    });
  }, [
    availableTextWidth,
    fontFamily,
    hideTranslationSubtitle,
    lines,
    lyricsFontScale,
    pendoloTuning.activeScale,
    resolvedSubtitleMode,
    subtitleTheme,
    targetLineIndex,
    theme,
  ]);

  // Calculate line items for wheel
  const lineItems = useMemo(() => {
    return calculatePendoloWheelLayout(
      lines,
      targetLineIndex,
      0,
      viewportSize.width,
      viewportSize.height,
      pendoloTuning,
      lyricRadiusOffset,
      lineBlockHeights,
    );
  }, [lineBlockHeights, lines, lyricRadiusOffset, targetLineIndex, viewportSize, pendoloTuning]);

  const primaryTextColor = theme.primaryColor || "#FFFFFF";
  const accentTextColor = theme.accentColor || "#3B82F6";
  const secondaryTextColor = theme.secondaryColor || "#9CA3AF";
  const BalanceIcon = useMemo<LucideIcon>(() => {
    const iconName = theme.lyricsIcons?.[0];
    return (
      ((iconName ? LucideIcons[iconName as keyof typeof LucideIcons] : undefined) as
        LucideIcon | undefined) ?? Star
    );
  }, [theme.lyricsIcons]);
  const balanceGearX = centerX + sideSign * baseRadius * 0.2;
  const balanceGearY = centerY - baseRadius * 0.75;
  const parallaxScalePx = tiltProjection.flat ? 0 : (pendoloTuning.parallaxDepth ?? 1) * baseRadius;
  const resolveLayerStyle = (
    heightRatio: number,
    zIndex: number,
    standUp = false,
  ): React.CSSProperties | undefined => {
    if (tiltProjection.flat) return undefined;
    const layer = buildPendoloLayerProjection(tiltProjection, heightRatio * parallaxScalePx);
    return {
      transform: standUp
        ? resolvePendoloSpaceCssTransform(layer)
        : resolvePendoloPlaneCssTransform(layer),
      transformOrigin: `${centerX}px ${centerY}px`,
      transformStyle: standUp ? "preserve-3d" : undefined,
      zIndex,
    };
  };
  const iconLayerStyle = resolveLayerStyle(PENDOLO_BALANCE_ICON_HEIGHT, 1);
  // 轮心视角下歌词立起来：图层带上高度方向（z），轨道层也保留 3D，句子各自绕底边转起来
  const standLyrics = hubView;
  // 字面正对相机：上方取相机的上方 (s·H, 0, D')，绕底边转 -atan2(D', H)；相机越高、字越往后仰
  const standUpTiltDeg =
    (-Math.atan2(lyricRingRadius + hubCameraBackPx, hubCameraHeightPx) * 180) / Math.PI;
  const lyricStandUp = useMemo<PendoloStandUp | undefined>(
    () => (standLyrics ? { rotationDeg: standUpRotationDeg, tiltDeg: standUpTiltDeg } : undefined),
    [standLyrics, standUpRotationDeg, standUpTiltDeg],
  );
  const lyricLayerStyle = resolveLayerStyle(PENDOLO_LYRIC_LAYER_HEIGHT, 2, standLyrics);
  const textOrigin = standLyrics ? "center center" : mirrored ? "right center" : "left center";

  return (
    <VisualizerShell
      theme={theme}
      audioPower={audioPower}
      audioBands={audioBands}
      sharedProps={props}
    >
      <div
        ref={visualizerRef}
        className="pointer-events-none relative size-full overflow-hidden select-none"
      >
        {/* Wireframe Dynamic Clockwork Canvas (Gears, Escapement & Hairspring) */}
        <PendoloClockworkCanvas
          centerX={centerX}
          centerY={centerY}
          viewportWidth={viewportSize.width}
          viewportHeight={viewportSize.height}
          baseRadius={baseRadius}
          lyricRingRadius={lyricRingRadius}
          escapementAngleMotionValue={gearRotationAngleRad}
          audioBassMotionValue={audioBands.bass}
          primaryTextColor={primaryTextColor}
          accentTextColor={accentTextColor}
          backgroundColor={theme.backgroundColor}
          showGearDecor={pendoloTuning.showGearDecor}
          showCenterGradient={pendoloTuning.showCenterGradient ?? true}
          showCover={pendoloTuning.showCoverOnWatchFace ?? false}
          coverUrl={props.coverUrl}
          enableLineGlow={pendoloTuning.enableLineGlow ?? false}
          paused={props.paused}
          motionProfile={motionProfile}
          renderScale={renderQuality.scale}
          antialias={resolveLyricAntialias(renderQuality.antialias, true)}
          mirrored={mirrored}
          projection={dialProjection}
          parallaxScalePx={parallaxScalePx}
          depthStencil={
            (requestedTiltDeg !== 0 || requestedHubView) && (pendoloTuning.parallaxDepth ?? 1) > 0
          }
          onBackendChange={setClockworkWebgl}
        />
        <div className="pointer-events-none absolute inset-0" style={iconLayerStyle}>
          {pendoloTuning.showGearDecor !== "none" && (
            <div
              className="pointer-events-none absolute"
              style={{
                left: `${balanceGearX}px`,
                top: `${balanceGearY}px`,
                zIndex: 1,
                transform: "translate(-50%, -50%)",
              }}
            >
              <BalanceIcon
                size={Math.max(14, baseRadius * 0.13)}
                strokeWidth={1.2}
                absoluteStrokeWidth
                color={colorWithAlpha(accentTextColor, 0.62)}
              />
            </div>
          )}
        </div>
        <div className="pointer-events-none absolute inset-0" style={lyricLayerStyle}>
          {/* Lyric Wheel Arc Items */}
          {showText && (
            <motion.div
              ref={wheelRailRef}
              className="pointer-events-auto absolute inset-0 size-full"
              style={{
                zIndex: 2,
                rotate: railRotationDeg,
                transformStyle: standLyrics ? "preserve-3d" : undefined,
                transformOrigin: `${centerX}px ${centerY}px`,
                WebkitTransform: "translateZ(0)",
              }}
            >
              {lineItems.map((item) => {
                const isFocal = item.isActive;
                const chorusPresentation = resolvePendoloChorusPresentation(
                  item.line.isChorus,
                  isFocal && item.index === currentLineIndex,
                  motionProfile,
                );
                const maxTextWidth = availableTextWidth / item.scale;
                const fontPx = Math.round((isFocal ? 28 : 22) * lyricsFontScale);
                const subtitleTracks = resolvePendoloSubtitleTracks(item.line, {
                  mode: resolvedSubtitleMode,
                  hidden: hideTranslationSubtitle,
                  focal: isFocal,
                  fontScale: lyricsFontScale,
                });

                return (
                  <PendoloRotatingLine
                    key={item.line.id ?? `pendolo-line-${item.index}`}
                    wheelRotationDeg={railRotationDeg}
                    mirrored={mirrored}
                    railWidth={viewportSize.width}
                    baseAngleDeg={item.angleDeg}
                    baseOpacity={
                      standLyrics && !isFocal
                        ? item.alpha * resolvePendoloStandSideLineAlpha(item.distanceFromActive)
                        : item.alpha
                    }
                    left={item.x}
                    top={item.y}
                    standUp={lyricStandUp}
                    fontFamily={fontFamily}
                    fontWeight={fontWeight}
                    onClick={
                      onLyricLineSeek
                        ? (event) => {
                            event.stopPropagation();
                            onLyricLineSeek(item.line.startTime);
                          }
                        : undefined
                    }
                  >
                    <motion.div
                      className="inline-block"
                      style={{
                        rotate: standLyrics ? 0 : textRotationCorrectionDeg,
                        x: standLyrics ? (mirrored ? "50%" : "-50%") : 0,
                        transformOrigin: textOrigin,
                        WebkitTransform: "translateZ(0)",
                      }}
                    >
                      <motion.div
                        className="relative inline-block"
                        initial={false}
                        animate={{ scale: chorusPresentation.haloScale }}
                        transition={{
                          duration: chorusPresentation.transitionDuration,
                          ease: "easeOut",
                        }}
                        style={{
                          transform: `rotate(${standLyrics ? 0 : sideSign * item.angleDeg * 0.35}deg) scale(${item.scale}) translateZ(0)`,
                          transformOrigin: textOrigin,
                          textAlign: standLyrics ? "center" : mirrored ? "right" : undefined,
                          isolation: "isolate",
                        }}
                      >
                        {chorusPresentation.isActive && (
                          <motion.div
                            aria-hidden
                            className="pointer-events-none absolute -z-10 rounded-2xl"
                            initial={{ opacity: 0, scale: 0.96 }}
                            animate={{ opacity: chorusPresentation.haloOpacity, scale: 1 }}
                            transition={{
                              duration: chorusPresentation.transitionDuration,
                              ease: "easeOut",
                            }}
                            style={{
                              inset: "-0.7em -1.1em",
                              background: `radial-gradient(circle at ${mirrored ? 58 : 42}% 50%, ${colorWithAlpha(accentTextColor, 0.14 * chorusPresentation.haloOpacity)} 0%, ${colorWithAlpha(accentTextColor, 0.035 * chorusPresentation.haloOpacity)} 55%, transparent 82%)`,
                              filter: `blur(${Math.round(10 * motionProfile.chorusGlowMultiplier)}px)`,
                            }}
                          />
                        )}
                        <div
                          style={{
                            transform: standLyrics ? "translateY(-100%)" : "translateY(-50%)",
                          }}
                        >
                          <div>
                            {isFocal ? (
                              <PendoloActiveLyricSweep
                                line={item.line}
                                currentTime={currentTime}
                                fontFamily={fontFamily}
                                fontWeight={fontWeight}
                                maxWidth={maxTextWidth}
                                primaryTextColor={primaryTextColor}
                                accentTextColor={accentTextColor}
                                fontPx={fontPx}
                                wordColors={theme.wordColors}
                                isChorus={chorusPresentation.isActive}
                                accentMix={chorusPresentation.accentMix}
                                chorusGlowMultiplier={chorusPresentation.glowMultiplier}
                                alignRight={mirrored}
                                alignCenter={standLyrics}
                              />
                            ) : (
                              <div
                                className="whitespace-pre-wrap transition-all duration-200"
                                style={{
                                  fontSize: `${fontPx}px`,
                                  maxWidth: `${maxTextWidth}px`,
                                  color: colorWithAlpha(primaryTextColor, 0.75),
                                  letterSpacing: "0.01em",
                                  whiteSpace: "pre-wrap",
                                  overflowWrap: "anywhere",
                                  wordBreak: "break-word",
                                }}
                              >
                                {item.line.fullText}
                              </div>
                            )}
                          </div>
                          {/* Romanization / translation rows (a second row steps down in size and opacity) */}
                          {subtitleTracks.map((track) => (
                            <div
                              key={track.role}
                              data-pendolo-subtitle-track={track.role}
                              className="whitespace-pre-wrap transition-opacity duration-200"
                              style={{
                                fontFamily: resolveThemeTranslationFontStack(
                                  subtitleTheme ?? theme,
                                ),
                                fontWeight: track.fontWeight,
                                fontSize: `${track.fontPx}px`,
                                maxWidth: `${maxTextWidth}px`,
                                color: isFocal
                                  ? secondaryTextColor
                                  : colorWithAlpha(secondaryTextColor, 0.6),
                                opacity:
                                  track.opacityFactor === 1 ? undefined : track.opacityFactor,
                                letterSpacing: "0.01em",
                                whiteSpace: "pre-wrap",
                                overflowWrap: "anywhere",
                                wordBreak: "break-word",
                                marginTop: `${track.gapEm}em`,
                              }}
                            >
                              {track.text}
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    </motion.div>
                  </PendoloRotatingLine>
                );
              })}
            </motion.div>
          )}
        </div>
      </div>
    </VisualizerShell>
  );
};

export default React.memo(VisualizerPendolo);
