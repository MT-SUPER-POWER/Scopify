"use client";

import { DesktopLyricHeader } from "@/components/lyrics/subtitle/DesktopLyricHeader";
import { SubtitleCapsule } from "@/components/lyrics/subtitle/SubtitleCapsule";
import { useCompanionCursorInside } from "@/hooks/desktopCompanion/useCompanionCursorInside";
import { useCompanionWindowDrag } from "@/hooks/desktopCompanion/useCompanionWindowDrag";
import { useDesktopLyricInteractiveRegion } from "@/hooks/lyrics/useDesktopLyricInteractiveRegion";
import { useDesktopSubtitle } from "@/hooks/lyrics/useDesktopSubtitle";
import { useInWindowShortcuts } from "@/hooks/shortcuts/useInWindowShortcuts";
import { useShortcutCommands } from "@/hooks/shortcuts/useShortcutCommands";
import { runtime } from "@/lib/runtime";
import { cn } from "@/lib/utils";
import { useDesktopSubtitleControl } from "@/store/module/desktopSubtitleControl";
import { useI18n } from "@/store/module/i18n";

const STAGE_JUSTIFY = {
  left: "justify-start",
  center: "justify-center",
  right: "justify-end",
} as const;

export function DesktopLyricView() {
  const { t } = useI18n();
  const view = useDesktopSubtitle();
  const locked = useDesktopSubtitleControl((state) => Boolean(state.preferences?.locked));
  const hovered = useCompanionCursorInside(runtime.desktopLyrics.onCursorInsideChanged);
  useDesktopLyricInteractiveRegion();
  const onPointerDown = useCompanionWindowDrag({
    disabled: locked,
    onMove: (x, y) =>
      runtime.desktopLyrics.sendCommand({ type: "move-desktop-lyric-window", x, y }),
    onEnd: () => runtime.desktopLyrics.sendCommand({ type: "save-desktop-lyric-window" }),
  });

  const executeCommand = useShortcutCommands({
    navigateTo: runtime.navigation.navigateMainWindow,
  });

  useInWindowShortcuts({
    commandIds: [
      "toggle-desktop-subtitle",
      "toggle-playback",
      "previous-track",
      "next-track",
      "increase-volume",
      "decrease-volume",
      "toggle-mute",
      "toggle-like",
    ],
    executeCommand,
  });

  const source = view.displaySource || t("subtitlePalette.waiting");

  return (
    <div
      data-desktop-lyrics-root
      onPointerDown={onPointerDown}
      className={cn(
        "group/lyric flex h-screen w-full flex-col overflow-hidden rounded-xl bg-transparent transition-colors duration-200 select-none",
        hovered && !locked && "bg-black/50",
        !locked && "cursor-move",
      )}
    >
      <DesktopLyricHeader hovered={hovered} locked={locked} />
      <div
        className={cn(
          "flex min-h-0 flex-1 items-start px-4 py-2",
          STAGE_JUSTIFY[view.settings.textAlign],
        )}
      >
        <SubtitleCapsule
          settings={{
            ...view.settings,
            entrance: view.activeLine && !view.isInterlude ? view.settings.entrance : "none",
            fillEnabled: view.settings.fillEnabled && Boolean(view.activeLine),
          }}
          payload={{
            source,
            target: view.activeLine?.translation ?? "",
            isChinese: view.isChinese,
          }}
          replayId={view.index}
          playback={view.playback}
          loop={false}
          fillLine={view.activeLine ?? undefined}
          singleLine
          lineDurationMs={view.lineDurationMs}
        />
      </div>
    </div>
  );
}
