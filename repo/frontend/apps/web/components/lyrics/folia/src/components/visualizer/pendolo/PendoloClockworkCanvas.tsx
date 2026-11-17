import React, { useEffect, useMemo, useRef } from "react";
import { resolveLyricPixelRatio } from "../../../utils/lyricRenderQuality";
import { colorWithAlpha } from "../colorMix";
import { drawPendoloClockwork2d } from "./pendoloClockworkDraw2d";
import {
  createPendoloClockworkMotionState,
  stepPendoloClockworkMotion,
} from "./pendoloClockworkMotion";
import {
  resolvePendoloClockworkBox,
  type PendoloClockworkFrameInput,
} from "./pendoloClockworkScene";
import type { PendoloClockworkCanvasProps } from "@/types/lyrics/folia/pendoloClockwork";
import { PendoloClockworkRenderer } from "./pendoloClockworkWebGL";

// src/components/visualizer/pendolo/PendoloClockworkCanvas.tsx

/**
 * PendoloClockworkCanvas: Renders dynamic wireframe clockwork gear train background.
 * PendoloClockworkCanvas: Wireframe clockwork gear train.
 * Prefers WebGL2; falls back to Canvas2D when unavailable.
 */
const PendoloClockworkCanvas: React.FC<PendoloClockworkCanvasProps> = ({
  centerX,
  centerY,
  viewportWidth,
  viewportHeight,
  baseRadius,
  lyricRingRadius,
  escapementAngleMotionValue,
  audioBassMotionValue,
  audioBass = 0.18,
  primaryTextColor,
  accentTextColor,
  backgroundColor = "#000000",
  showGearDecor,
  showCenterGradient = true,
  showCover = false,
  coverUrl = null,
  enableLineGlow = false,
  paused = false,
  motionProfile,
  renderScale = 1,
  antialias = true,
  mirrored = false,
  projection,
  parallaxScalePx = 0,
  depthStencil = false,
  onBackendChange,
}) => {
  const webglCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const canvas2dRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<PendoloClockworkRenderer | null>(null);
  const useWebglRef = useRef(false);
  // 上一帧实际用的后端，变了才通知上层
  const lastBackendRef = useRef<boolean | null>(null);
  const onBackendChangeRef = useRef(onBackendChange);
  onBackendChangeRef.current = onBackendChange;
  const motionStateRef = useRef(createPendoloClockworkMotionState());
  const lastTimestampRef = useRef<number | null>(null);
  const coverImageRef = useRef<HTMLImageElement | null>(null);
  // 封面图源不带 CORS 时 WebGL 传不了，这一张要走 Canvas2D。不带 CORS 的重试加载成功就记下，不等上传报错；
  // 按图源记住，下一首同一图源的封面一换上就走 2D，后端不会每首歌先 WebGL 再 2D 来回切
  const coverNeeds2dRef = useRef(false);
  const noCorsCoverOriginsRef = useRef(new Set<string>());
  // The canvases cover only the clockwork, not the viewport; everything is drawn relative to
  // the box, so the frame's centre is shifted by its offset.
  const contentBox = useMemo(
    () =>
      resolvePendoloClockworkBox(
        centerX,
        centerY,
        baseRadius,
        lyricRingRadius,
        viewportWidth,
        viewportHeight,
        showCenterGradient,
        mirrored,
        Boolean(projection && !projection.flat),
      ),
    [
      baseRadius,
      centerX,
      centerY,
      lyricRingRadius,
      mirrored,
      projection,
      showCenterGradient,
      viewportHeight,
      viewportWidth,
    ],
  );
  // 只在镜像或倾斜时把矩阵交给渲染器；都关着时是 null，画法和原来一样
  const projectionMatrix =
    mirrored || (projection && !projection.flat) ? (projection?.matrix ?? null) : null;

  const propsRef = useRef({
    contentBox,
    centerX,
    centerY,
    baseRadius,
    lyricRingRadius,
    audioBass,
    primaryTextColor,
    accentTextColor,
    backgroundColor,
    showGearDecor,
    showCenterGradient,
    showCover,
    coverUrl,
    enableLineGlow,
    paused,
    motionProfile,
    renderScale,
    projectionMatrix,
    projectionPerspective: Boolean(projection && !projection.flat),
    mirrored,
    parallaxScalePx: projection && !projection.flat ? parallaxScalePx : 0,
    parallaxLift: projection?.lift,
    parallaxInvFocal: projection?.invFocal,
  });

  useEffect(() => {
    propsRef.current = {
      contentBox,
      centerX,
      centerY,
      baseRadius,
      lyricRingRadius,
      audioBass,
      primaryTextColor,
      accentTextColor,
      backgroundColor,
      showGearDecor,
      showCenterGradient,
      showCover,
      coverUrl,
      enableLineGlow,
      paused,
      motionProfile,
      renderScale,
      projectionMatrix,
      projectionPerspective: Boolean(projection && !projection.flat),
      mirrored,
      parallaxScalePx: projection && !projection.flat ? parallaxScalePx : 0,
      parallaxLift: projection?.lift,
      parallaxInvFocal: projection?.invFocal,
    };
  }, [
    projectionMatrix,
    projection,
    mirrored,
    parallaxScalePx,
    contentBox,
    centerX,
    centerY,
    baseRadius,
    lyricRingRadius,
    audioBass,
    primaryTextColor,
    accentTextColor,
    backgroundColor,
    showGearDecor,
    showCenterGradient,
    showCover,
    coverUrl,
    enableLineGlow,
    paused,
    motionProfile,
    renderScale,
  ]);

  useEffect(() => {
    // 三层都关时画布不画也不跑循环，不会再上报后端；按 WebGL 报一次，上层不会一直卡在 2D 关着倾斜
    if (showGearDecor !== "none" || showCenterGradient || showCover) return;
    lastBackendRef.current = null;
    onBackendChangeRef.current?.(true);
  }, [showGearDecor, showCenterGradient, showCover]);

  useEffect(() => {
    // The previous song's cover must not stay on screen (or be uploaded under the new song)
    // while the new one loads.
    coverImageRef.current = null;
    coverNeeds2dRef.current = false;
    if (!showCover || !coverUrl) return undefined;
    let origin = "";
    try {
      origin = new URL(coverUrl, window.location.href).origin;
    } catch {
      origin = "";
    }
    coverNeeds2dRef.current = noCorsCoverOriginsRef.current.has(origin);
    let cancelled = false;
    let img: HTMLImageElement | null = null;
    // CORS first, like the other cover consumers: WebGL cannot upload a tainted image. A
    // host without CORS headers still gets a plain load, which the Canvas2D path can draw.
    const load = (crossOrigin: boolean) => {
      const next = new Image();
      if (crossOrigin) next.crossOrigin = "anonymous";
      next.onload = () => {
        if (cancelled) return;
        coverImageRef.current = next;
        // 不带 CORS 才加载得到的，才算这个图源没有 CORS；带 CORS 加载成功就把记录删掉
        coverNeeds2dRef.current = !crossOrigin;
        if (crossOrigin) noCorsCoverOriginsRef.current.delete(origin);
        else noCorsCoverOriginsRef.current.add(origin);
      };
      next.onerror = () => {
        if (cancelled) return;
        if (crossOrigin) {
          load(false);
        } else {
          // 两次都没加载到（404、离线）：没有封面可画，照常走 WebGL，也不记这个图源
          coverImageRef.current = null;
          coverNeeds2dRef.current = false;
        }
      };
      next.src = coverUrl;
      img = next;
    };
    load(true);
    return () => {
      cancelled = true;
      if (img) {
        img.onload = null;
        img.onerror = null;
      }
    };
  }, [coverUrl, showCover]);

  useEffect(() => {
    const webglCanvas = webglCanvasRef.current;
    // A renderer belongs to one canvas. Turning every layer off unmounts the canvases, and
    // turning one back on mounts new ones, so a renderer for any other canvas is dropped.
    // 抗锯齿变了时 WebGL 画布换了 key，也走这里：旧画布已经离开文档，release 把它的上下文还给浏览器。
    if (rendererRef.current && rendererRef.current.canvas !== webglCanvas) {
      rendererRef.current.release();
      rendererRef.current = null;
      useWebglRef.current = false;
    }
    if (showGearDecor === "none" && !showCenterGradient && !showCover) return undefined;

    const attachRenderer = () => {
      if (!webglCanvas || rendererRef.current) return;
      const created = new PendoloClockworkRenderer(webglCanvas, antialias, depthStencil);
      if (created.isReady) {
        rendererRef.current = created;
        useWebglRef.current = true;
        if (canvas2dRef.current) canvas2dRef.current.style.visibility = "hidden";
      } else {
        created.release();
        useWebglRef.current = false;
        webglCanvas.style.visibility = "hidden";
        if (canvas2dRef.current) canvas2dRef.current.style.visibility = "visible";
      }
    };
    attachRenderer();

    // A lost context (GPU reset, driver update, too many contexts) draws with Canvas2D until
    // the browser restores it; preventDefault is what allows the restore.
    const handleContextLost = (event: Event) => {
      event.preventDefault();
      rendererRef.current?.dispose();
      rendererRef.current = null;
      useWebglRef.current = false;
    };
    const handleContextRestored = () => attachRenderer();
    webglCanvas?.addEventListener("webglcontextlost", handleContextLost);
    webglCanvas?.addEventListener("webglcontextrestored", handleContextRestored);

    let animationFrameId = 0;

    const render = (timestamp: number) => {
      const p = propsRef.current;
      if (p.showGearDecor === "none" && !p.showCenterGradient && !p.showCover) return;

      if (lastTimestampRef.current === null) {
        lastTimestampRef.current = timestamp;
      }
      const dt = Math.min((timestamp - lastTimestampRef.current) / 1000, 0.05);
      lastTimestampRef.current = timestamp;

      const rawBass = audioBassMotionValue ? audioBassMotionValue.get() : p.audioBass;
      const motion = stepPendoloClockworkMotion(
        motionStateRef.current,
        dt,
        rawBass,
        p.paused,
        p.motionProfile,
      );
      // 2. Main gear wheel angle is strictly tied to lyric line ratchet steps
      // Gears remain stationary while a line is being sung, and ratchet ONLY when lyrics switch
      const escapementAngle = escapementAngleMotionValue.get();

      const box = p.contentBox;
      const frame: PendoloClockworkFrameInput = {
        centerX: p.centerX - box.left,
        centerY: p.centerY - box.top,
        baseRadius: p.baseRadius,
        lyricRingRadius: p.lyricRingRadius,
        escapementAngle,
        phase: motion.phase,
        bassOscillation: motion.bassOscillation,
        secondGearAngle: motion.secondGearAngle,
        primaryTextColor: p.primaryTextColor,
        accentTextColor: p.accentTextColor,
        backgroundColor: p.backgroundColor || "#000000",
        showGearDecor: p.showGearDecor,
        showCenterGradient: p.showCenterGradient,
        showCover: p.showCover,
        coverImage: coverImageRef.current,
        projection: p.projectionMatrix,
        projectionPerspective: p.projectionPerspective,
        mirrored: p.mirrored,
        parallaxScalePx: p.parallaxScalePx,
        parallaxLift: p.parallaxLift,
        parallaxInvFocal: p.parallaxInvFocal,
      };

      const width = box.width;
      const height = box.height;
      if (width <= 0 || height <= 0) {
        animationFrameId = window.requestAnimationFrame(render);
        return;
      }
      // 分辨率（#929）：原来的像素密度（devicePixelRatio）当底，乘上倍数；渲染器按变了的尺寸就地换缓冲
      const dpr = resolveLyricPixelRatio(window.devicePixelRatio || 1, p.renderScale);

      const renderer = rendererRef.current;
      if (useWebglRef.current && !renderer?.isReady) useWebglRef.current = false;
      // WebGL cannot upload a cover served without CORS headers, so frames that show such
      // a cover are drawn with Canvas2D, which can. The renderer stays attached.
      const coverNeeds2d = Boolean(
        frame.showCover && (coverNeeds2dRef.current || renderer?.isCoverRejected(frame.coverImage)),
      );

      const drawWebgl = Boolean(useWebglRef.current && renderer && !coverNeeds2d);
      if (lastBackendRef.current !== drawWebgl) {
        lastBackendRef.current = drawWebgl;
        onBackendChangeRef.current?.(drawWebgl);
      }
      if (drawWebgl && renderer) {
        if (webglCanvasRef.current) webglCanvasRef.current.style.visibility = "visible";
        if (canvas2dRef.current) canvas2dRef.current.style.visibility = "hidden";
        // Glow comes from the same CSS drop-shadow as Canvas2D, so both backends match.
        renderer.draw({
          input: frame,
          cssWidth: width,
          cssHeight: height,
          dpr,
        });
      } else {
        if (webglCanvasRef.current) webglCanvasRef.current.style.visibility = "hidden";
        const canvas = canvas2dRef.current;
        if (!canvas) {
          animationFrameId = window.requestAnimationFrame(render);
          return;
        }
        canvas.style.visibility = "visible";
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          animationFrameId = window.requestAnimationFrame(render);
          return;
        }
        const pixelWidth = Math.round(width * dpr);
        const pixelHeight = Math.round(height * dpr);
        if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
          canvas.width = pixelWidth;
          canvas.height = pixelHeight;
        }
        ctx.save();
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, width, height);
        // The DOM layers also fall back to a flat layout. Preserve a horizontal mirror in Canvas2D.
        if (frame.mirrored) {
          ctx.translate(frame.centerX, 0);
          ctx.scale(-1, 1);
          ctx.translate(-frame.centerX, 0);
        }
        drawPendoloClockwork2d(ctx, frame);
        ctx.restore();
      }

      animationFrameId = window.requestAnimationFrame(render);
    };

    animationFrameId = window.requestAnimationFrame(render);

    return () => {
      if (animationFrameId) window.cancelAnimationFrame(animationFrameId);
      webglCanvas?.removeEventListener("webglcontextlost", handleContextLost);
      webglCanvas?.removeEventListener("webglcontextrestored", handleContextRestored);
    };
  }, [
    showGearDecor,
    showCenterGradient,
    showCover,
    audioBassMotionValue,
    escapementAngleMotionValue,
    antialias,
    depthStencil,
  ]);

  useEffect(
    () => () => {
      rendererRef.current?.release();
      rendererRef.current = null;
    },
    [],
  );

  if (showGearDecor === "none" && !showCenterGradient && !showCover) {
    return null;
  }

  const canvasClass = "pointer-events-none absolute inset-0 size-full";
  const boxStyle: React.CSSProperties = {
    left: `${contentBox.left}px`,
    top: `${contentBox.top}px`,
    width: `${contentBox.width}px`,
    height: `${contentBox.height}px`,
    zIndex: 1,
  };
  // Same CSS glow on both backends so WebGL/Canvas2D luminance stays aligned.
  const lineGlow = enableLineGlow
    ? `drop-shadow(0 0 4px ${colorWithAlpha(accentTextColor, 0.65)}) drop-shadow(0 0 12px ${colorWithAlpha(accentTextColor, 0.3)})`
    : undefined;

  return (
    <div className="pointer-events-none absolute" style={boxStyle}>
      {/* 上下文属性跟着画布走：抗锯齿、深度模板变了换一块新画布 */}
      <canvas
        key={`${antialias ? "msaa" : "plain"}${depthStencil ? "-depth" : ""}`}
        ref={webglCanvasRef}
        className={canvasClass}
        style={{ filter: lineGlow }}
        aria-hidden="true"
      />
      <canvas
        ref={canvas2dRef}
        className={canvasClass}
        style={{ visibility: "hidden", filter: lineGlow }}
        aria-hidden="true"
      />
    </div>
  );
};

export default PendoloClockworkCanvas;
