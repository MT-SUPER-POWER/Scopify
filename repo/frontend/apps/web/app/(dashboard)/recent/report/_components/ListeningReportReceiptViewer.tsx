"use client";

import { motion } from "framer-motion";
import { Maximize2, Minus, Plus } from "lucide-react";

import { useReceiptZoom } from "@/hooks/listeningReport/useReceiptZoom";
import { cn } from "@/lib/utils";
import type { ListeningReportReceiptViewerProps } from "@/types/listeningReport/components";
import { ListeningReportReceipt } from "./ListeningReportReceipt";

const toolButton =
  "grid size-8 place-items-center rounded-full text-white/80 transition-colors hover:bg-white/15 hover:text-white disabled:pointer-events-none disabled:opacity-35";

export function ListeningReportReceiptViewer({
  children,
  ...receipt
}: ListeningReportReceiptViewerProps) {
  const zoom = useReceiptZoom();

  return (
    <div className="flex h-full flex-col">
      <div
        ref={zoom.viewport}
        className={cn(
          "relative min-h-0 flex-1 touch-none overflow-hidden select-none",
          zoom.isZoomed && (zoom.isDragging ? "cursor-grabbing" : "cursor-grab"),
        )}
        {...zoom.handlers}
      >
        <motion.div
          ref={zoom.content}
          className="absolute top-1/2 left-1/2 w-85 -translate-1/2"
          style={{ scale: zoom.scale, x: zoom.x, y: zoom.y }}
        >
          <ListeningReportReceipt {...receipt} interactive={!zoom.isZoomed} />
        </motion.div>
      </div>

      <div className="flex shrink-0 flex-wrap items-center justify-center gap-3 px-4 pt-2 pb-6">
        <div className="flex items-center gap-1 rounded-full border border-white/15 bg-white/10 p-1 text-white backdrop-blur-md">
          <button
            type="button"
            className={toolButton}
            onClick={zoom.zoomOut}
            disabled={!zoom.canZoomOut}
            aria-label="缩小"
            title="缩小 (-)"
          >
            <Minus className="size-4" />
          </button>
          <span className="w-12 text-center text-xs font-bold tabular-nums">
            {Math.round(zoom.zoomLevel * 100)}%
          </span>
          <button
            type="button"
            className={toolButton}
            onClick={zoom.zoomIn}
            disabled={!zoom.canZoomIn}
            aria-label="放大"
            title="放大 (+)"
          >
            <Plus className="size-4" />
          </button>
          <button
            type="button"
            className={toolButton}
            onClick={zoom.reset}
            disabled={!zoom.isZoomed}
            aria-label="适应屏幕"
            title="适应屏幕 (0)"
          >
            <Maximize2 className="size-3.5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
