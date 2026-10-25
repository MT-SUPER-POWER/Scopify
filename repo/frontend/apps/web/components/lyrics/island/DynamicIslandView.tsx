"use client";

import type { CSSProperties } from "react";
import { Music } from "lucide-react";
import { CompanionLyricText } from "@/components/lyrics/companion/CompanionLyricText";
import { DEFAULT_DYNAMIC_ISLAND_PREFERENCES } from "@/constants/desktopCompanion";
import { useCompanionCursorInside } from "@/hooks/desktopCompanion/useCompanionCursorInside";
import { useCompanionPreferences } from "@/hooks/desktopCompanion/useCompanionPreferences";
import { useCompanionWindowDrag } from "@/hooks/desktopCompanion/useCompanionWindowDrag";
import { useIsClient } from "@/hooks/desktopCompanion/useIsClient";
import { useTransparentDocument } from "@/hooks/desktopCompanion/useTransparentDocument";
import { useCompanionLyricLine } from "@/hooks/lyrics/useCompanionLyricLine";
import { useDynamicIslandLayout } from "@/hooks/lyrics/useDynamicIslandLayout";
import { useDynamicIslandMode } from "@/hooks/lyrics/useDynamicIslandMode";
import { useIslandLyricTransition } from "@/hooks/lyrics/useIslandLyricTransition";
import { buildDynamicIslandContent } from "@/lib/lyrics/companionLyricContent";
import { computeDynamicIslandMetrics } from "@/lib/lyrics/dynamicIslandLayout";
import { runtime } from "@/lib/runtime";
import { cn } from "@/lib/utils";

const EXPAND_TRANSITION = "width 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.25s ease-out";
const SHRINK_TRANSITION = "width 0.25s ease-in, opacity 0.25s ease-in";

/** 灵动岛依赖 canvas 测量文字宽度，静态导出预渲染时不输出内容。 */
export function DynamicIslandView() {
  useTransparentDocument();
  return useIsClient() ? <DynamicIsland /> : null;
}

function DynamicIsland() {
  const [stored] = useCompanionPreferences(
    runtime.dynamicIsland.getPreferences,
    runtime.dynamicIsland.onPreferencesChanged,
  );
  const preferences = stored ?? DEFAULT_DYNAMIC_ISLAND_PREFERENCES;
  const mode = useDynamicIslandMode();
  const hovered = useCompanionCursorInside(runtime.dynamicIsland.onCursorInsideChanged);
  const lyric = useCompanionLyricLine();
  const metrics = computeDynamicIslandMetrics(preferences.scale);
  const content = buildDynamicIslandContent(lyric, preferences.showTranslation);
  const { shown, shrinking, onTransitionEnd } = useIslandLyricTransition(
    content,
    preferences.transition,
  );
  const { slotWidth } = useDynamicIslandLayout(shown, metrics);
  const onPointerDown = useCompanionWindowDrag({
    disabled: preferences.nonOcclusive,
    onMove: (x, y) =>
      runtime.dynamicIsland.sendCommand({ type: "move-dynamic-island-window", x, y }),
    onEnd: () => runtime.dynamicIsland.sendCommand({ type: "save-dynamic-island-window" }),
  });
  const artwork = lyric.track?.artworkUrl;

  return (
    <div
      onPointerDown={onPointerDown}
      className="flex h-screen w-full items-start justify-center overflow-hidden select-none"
    >
      <div
        className={cn(
          "flex h-full items-center bg-black text-white transition-[border-radius,opacity] duration-300 ease-out",
          preferences.nonOcclusive ? hovered && "opacity-0" : "cursor-move",
        )}
        style={
          {
            gap: metrics.gap,
            paddingInline: metrics.paddingX,
            borderRadius:
              mode === "snapped" ? `0 0 ${metrics.snapRadius}px ${metrics.snapRadius}px` : 9999,
            "--lyric-played": "rgb(255 255 255)",
            "--lyric-unplayed": "rgb(255 255 255 / 50%)",
          } as CSSProperties
        }
      >
        <div
          className="flex shrink-0 items-center justify-center overflow-hidden bg-white/10"
          style={{
            width: metrics.coverSize,
            height: metrics.coverSize,
            borderRadius: metrics.coverRadius,
          }}
        >
          {artwork ? (
            <img src={artwork} alt="" draggable={false} className="size-full object-cover" />
          ) : (
            <Music className="size-1/2 text-white/60" />
          )}
        </div>
        <div
          onTransitionEnd={onTransitionEnd}
          className="flex h-full min-w-0 items-center justify-center overflow-hidden whitespace-nowrap"
          style={{
            width: shrinking ? 0 : slotWidth,
            opacity: shrinking ? 0 : 1,
            transition: shrinking ? SHRINK_TRANSITION : EXPAND_TRANSITION,
          }}
        >
          <div
            key={shown.key}
            className={cn(
              "w-full min-w-0 text-center",
              preferences.transition === "smooth" &&
                "animate-in duration-500 fade-in slide-in-from-bottom-2",
            )}
          >
            <p
              className="overflow-hidden leading-tight font-medium"
              style={{ fontSize: metrics.fontSize }}
            >
              <CompanionLyricText text={shown.main} progressLine={shown.progressLine} />
            </p>
            {shown.sub && (
              <p
                className="overflow-hidden text-white/65"
                style={{ fontSize: metrics.subFontSize, lineHeight: 1.2 }}
              >
                {shown.sub}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
