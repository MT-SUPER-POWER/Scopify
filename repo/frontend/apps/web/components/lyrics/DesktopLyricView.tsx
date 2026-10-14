"use client";

import type { CSSProperties } from "react";
import { SubtitleCapsule } from "@/components/lyrics/subtitle/SubtitleCapsule";
import { DesktopSubtitleToolbar } from "@/components/lyrics/subtitle/DesktopSubtitleToolbar";
import { useDesktopLyricInteractiveRegion } from "@/hooks/lyrics/useDesktopLyricInteractiveRegion";
import { useDesktopSubtitle } from "@/hooks/lyrics/useDesktopSubtitle";
import { useInWindowShortcuts } from "@/hooks/shortcuts/useInWindowShortcuts";
import { useShortcutCommands } from "@/hooks/shortcuts/useShortcutCommands";
import { runtime } from "@/lib/runtime";
import { cn } from "@/lib/utils";
import { useDesktopSubtitleControl } from "@/store/module/desktopSubtitleControl";
import { useI18n } from "@/store/module/i18n";

export function DesktopLyricView() {
  const { t } = useI18n();
  const view = useDesktopSubtitle();
  const clickThrough = useDesktopSubtitleControl((state) =>
    Boolean(state.preferences?.clickThrough),
  );
  useDesktopLyricInteractiveRegion();

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
      className="flex w-full items-start justify-center bg-transparent p-2"
    >
      <div
        ref={view.contentRef}
        className={cn(
          "group/subtitle relative w-fit max-w-full pt-8",
          !clickThrough && "cursor-grab active:cursor-grabbing",
        )}
        // 锁定后不再作为拖拽区，否则系统拖拽区域会吞掉转发给渲染进程的鼠标事件。
        style={{ WebkitAppRegion: clickThrough ? "no-drag" : "drag" } as CSSProperties}
      >
        <DesktopSubtitleToolbar />
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
          fillProgress={view.fillProgress}
        />
      </div>
    </div>
  );
}
