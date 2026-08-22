"use client";

import {
  type MouseEvent as ReactMouseEvent,
  type WheelEvent as ReactWheelEvent,
  useCallback,
  useEffect,
  useId,
  useState,
} from "react";
import {
  AlertCircle,
  Check,
  Copy,
  Maximize2,
  Minimize2,
  RotateCcw,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { useTheme } from "next-themes";

export interface MermaidProps {
  chart?: string | { default?: string };
  src?: string | { default?: string };
}

export function Mermaid({ chart, src }: MermaidProps) {
  const id = useId();
  const safeId = `mermaid_${id.replace(/[^a-zA-Z0-9_-]/g, "_")}`;
  const { resolvedTheme } = useTheme();

  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [copied, setCopied] = useState(false);

  const raw =
    typeof chart === "string"
      ? chart
      : typeof chart === "object" && chart?.default
        ? chart.default
        : typeof src === "string"
          ? src
          : typeof src === "object" && src?.default
            ? src.default
            : "";
  const cleanChart = raw.replaceAll("\\n", "\n").trim();

  useEffect(() => {
    let cancelled = false;

    async function renderChart() {
      try {
        const { default: mermaid } = await import("mermaid");
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "loose",
          fontFamily: "inherit",
          themeCSS: "margin: 1rem auto 0; font-family: inherit;",
          theme: resolvedTheme === "dark" ? "dark" : "default",
        });

        const res = await mermaid.render(safeId, cleanChart);
        if (!cancelled) {
          setSvg(res.svg);
          setError(null);
          setLoading(false);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          const msg =
            err instanceof Error
              ? err.message
              : typeof err === "string"
                ? err
                : "Mermaid 图表解析错误";
          setError(msg);
          setLoading(false);
        }
      }
    }

    renderChart();
    return () => {
      cancelled = true;
    };
  }, [cleanChart, resolvedTheme, safeId]);

  const handleCopy = useCallback(
    async (e: ReactMouseEvent) => {
      e.stopPropagation();
      await navigator.clipboard.writeText(cleanChart);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    },
    [cleanChart],
  );

  const handleOpenFullscreen = useCallback(() => {
    if (error || loading) return;
    setScale(1.2);
    setPosition({ x: 0, y: 0 });
    setIsFullscreen(true);
  }, [error, loading]);

  const handleCloseFullscreen = useCallback(() => {
    setIsFullscreen(false);
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  // Keyboard escape listener
  useEffect(() => {
    if (!isFullscreen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleCloseFullscreen();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen, handleCloseFullscreen]);

  // Lock body scroll when fullscreen
  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isFullscreen]);

  const handleZoomIn = () => setScale((prev) => Math.min(prev + 0.25, 4));
  const handleZoomOut = () => setScale((prev) => Math.max(prev - 0.25, 0.4));
  const handleResetZoom = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleWheel = (e: ReactWheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      setScale((prev) => Math.min(prev + 0.15, 4));
    } else {
      setScale((prev) => Math.max(prev - 0.15, 0.4));
    }
  };

  const handleMouseDown = (e: ReactMouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: ReactMouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  // If there's an error parsing the chart, render a fallback alert
  if (error) {
    return (
      <div className="border-destructive/30 bg-destructive/5 my-6 overflow-hidden rounded-xl border p-4 text-sm">
        <div className="text-destructive flex items-center gap-2 font-medium">
          <AlertCircle className="size-4 shrink-0" />
          <span>Mermaid 图表渲染失败</span>
        </div>
        <p className="text-muted-foreground mt-2 font-mono text-xs">{error}</p>
        <pre className="bg-fd-secondary/60 text-fd-foreground mt-3 overflow-x-auto rounded-lg p-3 font-mono text-xs">
          {cleanChart}
        </pre>
      </div>
    );
  }

  // Loading skeleton placeholder
  if (loading && !svg) {
    return (
      <div className="border-fd-border bg-fd-card/40 my-6 flex min-h-[140px] items-center justify-center rounded-xl border p-6">
        <span className="text-fd-muted-foreground animate-pulse text-xs">
          正在渲染 Mermaid 图表...
        </span>
      </div>
    );
  }

  return (
    <>
      {/* Inline Preview Container */}
      <div className="group border-fd-border bg-fd-card/60 hover:border-fd-primary/40 relative my-6 overflow-hidden rounded-xl border shadow-xs transition-colors">
        {/* Floating Action Bar */}
        <div className="border-fd-border/80 bg-fd-background/90 absolute top-2.5 right-2.5 z-10 flex items-center gap-1.5 rounded-lg border p-1 shadow-xs backdrop-blur-md transition-opacity">
          <button
            type="button"
            onClick={handleCopy}
            title={copied ? "已复制" : "复制 Mermaid 源码"}
            className="text-fd-muted-foreground hover:bg-fd-accent hover:text-fd-accent-foreground flex size-7 items-center justify-center rounded-md transition-colors"
          >
            {copied ? (
              <Check className="size-3.5 text-emerald-500" />
            ) : (
              <Copy className="size-3.5" />
            )}
          </button>
          <button
            type="button"
            onClick={handleOpenFullscreen}
            title="全屏放大查看"
            className="text-fd-muted-foreground hover:bg-fd-accent hover:text-fd-foreground flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium transition-colors"
          >
            <Maximize2 className="size-3.5" />
            <span>全屏查看</span>
          </button>
        </div>

        {/* Diagram Area */}
        <div
          role="button"
          tabIndex={0}
          onClick={handleOpenFullscreen}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") handleOpenFullscreen();
          }}
          className="flex min-h-[140px] cursor-zoom-in items-center justify-center overflow-x-auto p-6 transition-transform [&_svg]:max-w-none [&_svg]:min-w-[500px]"
          dangerouslySetInnerHTML={{ __html: svg }}
        />

        {/* Bottom hover hint */}
        <div className="border-fd-border/50 bg-fd-secondary/30 text-fd-muted-foreground border-t px-3 py-1.5 text-center text-[11px] opacity-70 transition-opacity group-hover:opacity-100">
          点击图表或右上角按钮即可全屏缩放与拖拽查看
        </div>
      </div>

      {/* Fullscreen Interactive Lightbox Modal */}
      {isFullscreen && (
        <div
          role="dialog"
          aria-modal="true"
          className="bg-fd-background/95 animate-in fade-in fixed inset-0 z-50 flex flex-col backdrop-blur-xl duration-200"
        >
          {/* Header Controls */}
          <div className="border-fd-border flex h-14 shrink-0 items-center justify-between border-b px-6">
            <div className="flex items-center gap-2">
              <span className="text-fd-foreground text-sm font-semibold">Mermaid 全屏预览</span>
              <span className="text-fd-muted-foreground text-xs">
                （支持滚轮缩放与鼠标拖拽平移）
              </span>
            </div>

            {/* Toolbar */}
            <div className="flex items-center gap-2">
              <div className="border-fd-border bg-fd-secondary/50 flex items-center gap-1 rounded-lg border p-1">
                <button
                  type="button"
                  onClick={handleZoomOut}
                  title="缩小"
                  className="text-fd-muted-foreground hover:bg-fd-accent hover:text-fd-foreground flex size-7 items-center justify-center rounded-md transition-colors"
                >
                  <ZoomOut className="size-4" />
                </button>
                <span className="text-fd-foreground min-w-[50px] text-center font-mono text-xs font-medium">
                  {Math.round(scale * 100)}%
                </span>
                <button
                  type="button"
                  onClick={handleZoomIn}
                  title="放大"
                  className="text-fd-muted-foreground hover:bg-fd-accent hover:text-fd-foreground flex size-7 items-center justify-center rounded-md transition-colors"
                >
                  <ZoomIn className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={handleResetZoom}
                  title="重置缩放与位置"
                  className="text-fd-muted-foreground hover:bg-fd-accent hover:text-fd-foreground flex size-7 items-center justify-center rounded-md transition-colors"
                >
                  <RotateCcw className="size-3.5" />
                </button>
              </div>

              <button
                type="button"
                onClick={handleCopy}
                className="border-fd-border bg-fd-secondary/50 text-fd-muted-foreground hover:bg-fd-accent hover:text-fd-foreground flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors"
              >
                {copied ? (
                  <Check className="size-3.5 text-emerald-500" />
                ) : (
                  <Copy className="size-3.5" />
                )}
                <span>{copied ? "已复制" : "复制代码"}</span>
              </button>

              <button
                type="button"
                onClick={handleCloseFullscreen}
                className="border-fd-border bg-fd-secondary text-fd-muted-foreground hover:bg-fd-destructive flex size-8 items-center justify-center rounded-lg border transition-colors hover:text-white"
                title="关闭全屏 (ESC)"
              >
                <Minimize2 className="size-4" />
              </button>
            </div>
          </div>

          {/* Interactive Canvas */}
          <div
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className={`relative flex flex-1 items-center justify-center overflow-hidden p-8 select-none ${
              isDragging ? "cursor-grabbing" : "cursor-grab"
            }`}
          >
            <div
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                transformOrigin: "center center",
                transition: isDragging ? "none" : "transform 0.15s ease-out",
              }}
              className="flex items-center justify-center [&_svg]:max-w-none"
              dangerouslySetInnerHTML={{ __html: svg }}
            />
          </div>
        </div>
      )}
    </>
  );
}
