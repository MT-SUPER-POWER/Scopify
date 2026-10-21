"use client";

import { useRef, useState, type CSSProperties } from "react";
import { Music } from "lucide-react";
import { TaskbarLyricControls } from "@/components/lyrics/taskbar/TaskbarLyricControls";
import { TaskbarLyricLine } from "@/components/lyrics/taskbar/TaskbarLyricLine";
import { DEFAULT_TASKBAR_LYRIC_PREFERENCES } from "@/constants/desktopCompanion";
import { useCompanionPreferences } from "@/hooks/desktopCompanion/useCompanionPreferences";
import { useIsClient } from "@/hooks/desktopCompanion/useIsClient";
import { useTransparentDocument } from "@/hooks/desktopCompanion/useTransparentDocument";
import { useCompanionLyricLine } from "@/hooks/lyrics/useCompanionLyricLine";
import { useTaskbarLyricContentWidth } from "@/hooks/lyrics/useTaskbarLyricContentWidth";
import { useTaskbarLyricLayout } from "@/hooks/lyrics/useTaskbarLyricLayout";
import { buildTaskbarLyricItems } from "@/lib/lyrics/companionLyricContent";
import { resolveTaskbarLyricTheme } from "@/lib/lyrics/taskbarLyricTheme";
import { runtime } from "@/lib/runtime";
import { cn } from "@/lib/utils";

/** 光标离开后稍等再收起，避免掠过控件边缘时来回闪。 */
const HOVER_LEAVE_DELAY_MS = 40;

/** 任务栏歌词依赖 canvas 测量与窗口尺寸，静态导出预渲染时不输出内容。 */
export function TaskbarLyricView() {
  useTransparentDocument();
  return useIsClient() ? <TaskbarLyric /> : null;
}

function TaskbarLyric() {
  const [stored] = useCompanionPreferences(
    runtime.taskbarLyric.getPreferences,
    runtime.taskbarLyric.onPreferencesChanged,
  );
  const preferences = stored ?? DEFAULT_TASKBAR_LYRIC_PREFERENCES;
  const layout = useTaskbarLyricLayout();
  const lyric = useCompanionLyricLine();
  const [hovered, setHovered] = useState(false);
  const leaveTimer = useRef<number | null>(null);
  const anchor = layout?.anchor ?? "left";
  const items = buildTaskbarLyricItems(lyric, preferences);
  const theme = resolveTaskbarLyricTheme(preferences.colorMode, layout?.isLight ?? false);
  const track = lyric.track;
  useTaskbarLyricContentWidth({
    items,
    fontSize: preferences.fontSize,
    showCover: preferences.showCover,
    hovered,
    maxWidth: layout?.maxWidth ?? null,
  });

  const setHover = (next: boolean) => {
    if (leaveTimer.current !== null) window.clearTimeout(leaveTimer.current);
    leaveTimer.current = null;
    if (next) setHovered(true);
    else leaveTimer.current = window.setTimeout(() => setHovered(false), HOVER_LEAVE_DELAY_MS);
  };

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className={cn(
        "flex h-screen w-screen items-center px-1.5 select-none",
        anchor === "right" ? "justify-end" : "justify-start",
      )}
    >
      <div
        className={cn(
          "relative flex h-[calc(100%-8px)] w-full items-center overflow-hidden rounded-lg transition-colors duration-300",
          anchor === "right" && "flex-row-reverse",
          preferences.showBackground && hovered && "bg-(--tbl-hover)",
        )}
        style={
          {
            "--tbl-primary": theme.primary,
            "--tbl-secondary": theme.secondary,
            "--tbl-hover": theme.hover,
            "--lyric-played": theme.primary,
            "--lyric-unplayed": theme.secondary,
          } as CSSProperties
        }
      >
        {preferences.showCover && (
          <div className="flex aspect-square h-full shrink-0 items-center justify-center p-1">
            {track?.artworkUrl ? (
              <img
                src={track.artworkUrl}
                alt=""
                draggable={false}
                className="size-full rounded-md object-cover"
              />
            ) : (
              <Music className="size-1/2 text-(--tbl-secondary)" />
            )}
          </div>
        )}
        <TaskbarLyricControls visible={hovered} />
        <div className="relative mx-1 h-full min-w-0 flex-1 overflow-hidden">
          <div
            className={cn(
              "absolute inset-0 flex flex-col justify-evenly transition-opacity duration-200",
              anchor === "right" && "items-end",
              hovered && "pointer-events-none opacity-0",
            )}
          >
            {items.map((item) => (
              <TaskbarLyricLine
                key={item.key}
                item={item}
                fontSize={preferences.fontSize}
                align={anchor}
                playback={item.role === "primary" ? lyric.playback : undefined}
                lineDurationMs={lyric.lineDurationMs}
              />
            ))}
          </div>
          <div
            className={cn(
              "absolute inset-0 flex flex-col justify-evenly transition-opacity duration-200",
              anchor === "right" && "items-end",
              hovered ? "opacity-100 delay-75" : "pointer-events-none opacity-0",
            )}
          >
            <p
              className="max-w-full truncate text-(--tbl-primary)"
              style={{ fontSize: preferences.fontSize }}
            >
              {track?.title ?? "Scopify"}
            </p>
            {preferences.doubleLine && track && (
              <p
                className="max-w-full truncate text-(--tbl-secondary)"
                style={{ fontSize: preferences.fontSize * 0.82 }}
              >
                {track.artistNames.join(" / ")}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
