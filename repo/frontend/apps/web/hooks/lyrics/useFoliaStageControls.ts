"use client";

import { useEffect, useState } from "react";
import { usePlayerChromeAutoHide } from "@/components/lyrics/folia/src/hooks/usePlayerChromeAutoHide";
import { useFoliaSettingsStore } from "@/store/module/foliaSettings";
import { useLyricStageStore } from "@/store/module/lyrics";
import { useUiStore } from "@/store/module/ui";
import type { LyricStageProps } from "@/types/components/lyrics";
import type { DesktopLyricCommand } from "@/types/desktopLyric";

const keepAutoHideEnabled = () => undefined;

export function useFoliaStageControls({ onClose }: LyricStageProps) {
  const [isBorderVisible, setIsBorderVisible] = useState(false);
  const [isPlayerChromeHidden, setIsPlayerChromeHidden] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTransparent, setIsTransparent] = useState(false);
  const { cyclePlayerChromeVisibilityMode, setPlayerChromeVisibilityMode } =
    usePlayerChromeAutoHide({
      autoHidePlayerChrome: true,
      initialPlayerChromeHidden: false,
      setAutoHidePlayerChromePreference: keepAutoHideEnabled,
      setIsPlayerChromeHidden,
    });

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      // Stage owns bare keys only; combinations belong to global shortcuts.
      if (
        event.defaultPrevented ||
        event.isComposing ||
        event.repeat ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey ||
        event.shiftKey
      )
        return;
      const modals = useFoliaSettingsStore.getState();
      const ui = useUiStore.getState();
      if (
        modals.visualSection !== null ||
        modals.themeLibraryOpen ||
        useLyricStageStore.getState().sonnetPerformanceWarningOpen ||
        ui.isSearchOpen ||
        ui.isShortcutHelpOpen
      )
        return;
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (
        event.target instanceof Element &&
        event.target.closest(
          'input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="textbox"]',
        )
      )
        return;
      if (event.key.toLowerCase() === "h") {
        event.preventDefault();
        cyclePlayerChromeVisibilityMode();
      }
      if (event.key.toLowerCase() === "p") {
        event.preventDefault();
        setIsSettingsOpen((open) => !open);
      }
    };
    const onDesktopCommand = (event: Event) => {
      const command = (event as CustomEvent<DesktopLyricCommand>).detail;
      if (!command) return;
      if (command.type === "set-stage-transparent") setIsTransparent(command.enabled);
      if (command.type === "set-stage-border-visible") setIsBorderVisible(command.visible);
      if (command.type === "set-stage-controls-visible") {
        setPlayerChromeVisibilityMode(command.visible ? "always-visible" : "always-hidden");
      }
    };
    window.addEventListener("desktop-lyric:stage-command", onDesktopCommand);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("desktop-lyric:stage-command", onDesktopCommand);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [cyclePlayerChromeVisibilityMode, onClose, setPlayerChromeVisibilityMode]);

  return {
    isBorderVisible,
    isPlayerChromeHidden,
    isSettingsOpen,
    isTransparent,
    setIsSettingsOpen,
  };
}
