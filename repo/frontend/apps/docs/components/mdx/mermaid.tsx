"use client";

import {
  type MouseEvent as ReactMouseEvent,
  type WheelEvent as ReactWheelEvent,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import {
  AlertCircle,
  Check,
  Copy,
  Maximize2,
  Minimize2,
  RotateCcw,
  Scan,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { useTheme } from "next-themes";

export interface MermaidProps {
  chart?: string | { default?: string };
  src?: string | { default?: string };
}

interface SvgDimensions {
  width: number;
  height: number;
}

function extractSvgDimensions(svgString: string): SvgDimensions | null {
  const vbMatch = svgString.match(
    /viewBox=["']\s*([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s*["']/i,
  );
  if (vbMatch) {
    const width = parseFloat(vbMatch[3]);
    const height = parseFloat(vbMatch[4]);
    if (!Number.isNaN(width) && !Number.isNaN(height) && width > 0 && height > 0) {
      return { width, height };
    }
  }

  const wMatch = svgString.match(/width=["']\s*([-\d.]+)(px)?\s*["']/i);
  const hMatch = svgString.match(/height=["']\s*([-\d.]+)(px)?\s*["']/i);
  if (wMatch && hMatch) {
    const width = parseFloat(wMatch[1]);
    const height = parseFloat(hMatch[2]);
    if (!Number.isNaN(width) && !Number.isNaN(height) && width > 0 && height > 0) {
      return { width, height };
    }
  }

  return null;
}

export function Mermaid({ chart, src }: MermaidProps) {
  const id = useId();
  const safeId = `mermaid_${id.replace(/[^a-zA-Z0-9_-]/g, "_")}`;
  const { resolvedTheme } = useTheme();

  const [svg, setSvg] = useState<string>("");
  const [dimensions, setDimensions] = useState<SvgDimensions | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [copied, setCopied] = useState(false);

  const canvasRef = useRef<HTMLDivElement>(null);

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
          theme: resolvedTheme === "dark" ? "dark" : "default",
          flowchart: { useMaxWidth: false, htmlLabels: true, curve: "basis", padding: 16 },
          sequence: { useMaxWidth: false },
          gantt: { useMaxWidth: false },
          journey: { useMaxWidth: false },
          class: { useMaxWidth: false },
          state: { useMaxWidth: false },
          er: { useMaxWidth: false },
          pie: { useMaxWidth: false },
          quadrantChart: { useMaxWidth: false },
          xyChart: { useMaxWidth: false },
          requirement: { useMaxWidth: false },
          mindmap: { useMaxWidth: false },
          timeline: { useMaxWidth: false },
          gitGraph: { useMaxWidth: false },
          c4: { useMaxWidth: false },
          sankey: { useMaxWidth: false },
          block: { useMaxWidth: false },
          architecture: { useMaxWidth: false },
          themeVariables: {
            fontFamily: "inherit",
            fontSize: "14px",
          },
        });

        const res = await mermaid.render(safeId, cleanChart);
        if (!cancelled) {
          setSvg(res.svg);
          setDimensions(extractSvgDimensions(res.svg));
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

  const getFitScale = useCallback(
    (dims?: SvgDimensions | null) => {
      const targetDims = dims ?? dimensions;
      if (!targetDims || typeof window === "undefined") return 1;

      const availW = Math.max(window.innerWidth - 80, 240);
      const availH = Math.max(window.innerHeight - 150, 240);

      const scaleX = availW / targetDims.width;
      const scaleY = availH / targetDims.height;
      const fit = Math.min(scaleX, scaleY);

      // Clamp fit scale so tiny charts don't over-expand, and large charts fit screen
      return Math.min(Math.max(fit, 0.25), 2.0);
    },
    [dimensions],
  );

  const handleOpenFullscreen = useCallback(() => {
    if (error || loading) return;
    const initialScale = getFitScale(dimensions);
    setScale(initialScale);
    setPosition({ x: 0, y: 0 });
    setIsFullscreen(true);
  }, [error, loading, getFitScale, dimensions]);

  const handleCloseFullscreen = useCallback(() => {
    setIsFullscreen(false);
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  const handleResetToFit = useCallback(() => {
    setScale(getFitScale(dimensions));
    setPosition({ x: 0, y: 0 });
  }, [getFitScale, dimensions]);

  const handleResetToActualSize = useCallback(() => {
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

  const handleZoomIn = () => setScale((prev) => Math.min(prev * 1.25, 6.0));
  const handleZoomOut = () => setScale((prev) => Math.max(prev / 1.25, 0.2));

  // Pointer-centered wheel zooming
  const handleWheel = (e: ReactWheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
    setScale((prevScale) => {
      const nextScale = Math.min(Math.max(prevScale * zoomFactor, 0.2), 6.0);
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        const pointerX = e.clientX - rect.left - rect.width / 2;
        const pointerY = e.clientY - rect.top - rect.height / 2;
        const ratio = nextScale / prevScale;
        setPosition((prevPos) => ({
          x: pointerX - (pointerX - prevPos.x) * ratio,
          y: pointerY - (pointerY - prevPos.y) * ratio,
        }));
      }
      return nextScale;
    });
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
          className="flex min-h-[140px] cursor-zoom-in items-center justify-center overflow-x-auto p-6 transition-all"
        >
          <div
            style={{
              width: dimensions ? `${dimensions.width}px` : "100%",
              maxWidth: "100%",
            }}
            className="flex items-center justify-center [&_svg]:h-auto [&_svg]:w-full [&_svg]:max-w-full"
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        </div>

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
                （支持滚轮缩放与鼠标拖拽平移，双击重置）
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
                <div className="bg-fd-border mx-0.5 h-4 w-px" />
                <button
                  type="button"
                  onClick={handleResetToFit}
                  title="自适应窗口大小"
                  className="text-fd-muted-foreground hover:bg-fd-accent hover:text-fd-foreground flex items-center gap-1 rounded-md px-1.5 py-1 text-xs transition-colors"
                >
                  <Scan className="size-3.5" />
                  <span>自适应</span>
                </button>
                <button
                  type="button"
                  onClick={handleResetToActualSize}
                  title="原始比例 (100%)"
                  className="text-fd-muted-foreground hover:bg-fd-accent hover:text-fd-foreground flex items-center gap-1 rounded-md px-1.5 py-1 text-xs transition-colors"
                >
                  <span>1:1</span>
                </button>
                <button
                  type="button"
                  onClick={handleResetToFit}
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
            ref={canvasRef}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onDoubleClick={handleResetToFit}
            className={`relative flex flex-1 items-center justify-center overflow-hidden p-8 select-none ${
              isDragging ? "cursor-grabbing" : "cursor-grab"
            }`}
          >
            <div
              style={{
                width: dimensions ? `${dimensions.width}px` : "auto",
                height: dimensions ? `${dimensions.height}px` : "auto",
                transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                transformOrigin: "center center",
                transition: isDragging ? "none" : "transform 0.12s ease-out",
              }}
              className="flex shrink-0 items-center justify-center [&_svg]:h-full [&_svg]:w-full [&_svg]:max-w-none"
              dangerouslySetInnerHTML={{ __html: svg }}
            />
          </div>
        </div>
      )}
    </>
  );
}
