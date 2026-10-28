"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usePlayerChromeAutoHide } from "@/components/lyrics/folia/src/hooks/usePlayerChromeAutoHide";
import { useFoliaSettingsStore } from "@/store/module/foliaSettings";
import { useLyricStageStore } from "@/store/module/lyrics";
import { useUiStore } from "@/store/module/ui";
import type { LyricStageProps } from "@/types/lyrics/components";
import type { DesktopLyricCommand } from "@/types/desktopLyric";

const keepAutoHideEnabled = () => undefined;

export function useFoliaStageControls({ onClose }: LyricStageProps) {
  const router = useRouter();
  const [isBorderVisible, setIsBorderVisible] = useState(false);
  const [isPlayerChromeHidden, setIsPlayerChromeHidden] = useState(false);
  const isSettingsOpen = useFoliaSettingsStore((state) => state.stagePanelOpen);
  const setIsSettingsOpen = useFoliaSettingsStore((state) => state.setStagePanelOpen);
  const [isTransparent, setIsTransparent] = useState(false);

  useEffect(() => {
    return () => {
      useFoliaSettingsStore.getState().setStagePanelOpen(false);
    };
  }, []);
  const autoHideCursorWithChrome = useLyricStageStore((state) => state.autoHideCursorWithChrome);
  const {
    cyclePlayerChromeVisibilityMode,
    playerChromeVisibilityMode,
    setPlayerChromeVisibilityMode,
  } = usePlayerChromeAutoHide({
    autoHidePlayerChrome: true,
    initialPlayerChromeHidden: false,
    setAutoHidePlayerChromePreference: keepAutoHideEnabled,
    setIsPlayerChromeHidden,
  });
  // Folia f1e4f577: the pointer rides the chrome's idle clock instead of owning a timer. Only the
  // auto-hide mode has a reveal path; the pinned hidden mode would otherwise lose the pointer.
  const isCursorHidden =
    autoHideCursorWithChrome && playerChromeVisibilityMode === "auto-hide" && isPlayerChromeHidden;

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
        if (useFoliaSettingsStore.getState().stagePanelOpen) {
          setIsSettingsOpen(false);
          return;
        }
        onClose();
        return;
      }
      if (event.key === "Home") {
        event.preventDefault();
        setIsSettingsOpen(false);
        onClose();
        router.push("/");
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
        setIsSettingsOpen(!useFoliaSettingsStore.getState().stagePanelOpen);
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
  }, [
    cyclePlayerChromeVisibilityMode,
    onClose,
    router,
    setIsSettingsOpen,
    setPlayerChromeVisibilityMode,
  ]);

  return {
    isBorderVisible,
    isCursorHidden,
    isPlayerChromeHidden,
    isSettingsOpen,
    isTransparent,
    setIsSettingsOpen,
  };
}
