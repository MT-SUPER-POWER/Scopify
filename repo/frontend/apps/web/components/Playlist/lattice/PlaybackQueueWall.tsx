"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";

import { isPersonalFmPlaybackSource } from "@/constants/personalFm";
import { useQueueRadioWall } from "@/store/module/lattice";
import { usePlayerStore } from "@/store/module/player";
import { useUiStore } from "@/store/module/ui";
import type { PlaylistViewMode } from "@/types/playlist/lattice";

import { PlaylistWallSurface } from "./PlaylistLatticeView";

function closeWall() {
  useQueueRadioWall.setState({ open: false });
}

export default function PlaybackQueueWall() {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const tracks = usePlayerStore((state) => state.queue);
  const sourceId = usePlayerStore((state) => state.playlistId);
  const lyricsOpen = useUiStore((state) => state.isLyricsOpen || state.isCenterLyricsOpen);
  const [mode, setMode] = useState<PlaylistViewMode>("radio");
  const title = t(isPersonalFmPlaybackSource(sourceId) ? "personalFm.title" : "queue.title");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (lyricsOpen) closeWall();
  }, [lyricsOpen]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented) return;
      event.preventDefault();
      closeWall();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  if (!mounted || typeof document === "undefined") return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-40 h-dvh w-dvw overflow-hidden bg-card text-content"
    >
      <PlaylistWallSurface
        mode={mode}
        title={title}
        tracks={tracks}
        sourceId={sourceId}
        playbackQueue
        onModeChange={setMode}
        onClose={closeWall}
      />
      <button
        type="button"
        className="absolute top-3 left-3 z-40 grid size-9 place-items-center rounded-full border border-white/20 bg-black/65 text-white hover:bg-black/85 focus-visible:outline-2 focus-visible:outline-primary"
        onClick={closeWall}
        aria-label={t("ui.close")}
      >
        <X className="size-5" />
      </button>
    </div>,
    document.body,
  );
}
