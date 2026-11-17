"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
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
  const dialogRef = useRef<HTMLDialogElement>(null);
  const tracks = usePlayerStore((state) => state.queue);
  const sourceId = usePlayerStore((state) => state.playlistId);
  const lyricsOpen = useUiStore((state) => state.isLyricsOpen || state.isCenterLyricsOpen);
  const [mode, setMode] = useState<PlaylistViewMode>("radio");
  const title = t(isPersonalFmPlaybackSource(sourceId) ? "personalFm.title" : "queue.title");

  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    dialog.showModal();
    return () => dialog.close();
  }, []);

  useEffect(() => {
    if (lyricsOpen) closeWall();
  }, [lyricsOpen]);

  return (
    <dialog
      ref={dialogRef}
      aria-label={title}
      onCancel={(event) => {
        event.preventDefault();
        closeWall();
      }}
      className="fixed inset-0 m-0 h-dvh max-h-none w-dvw max-w-none overflow-hidden border-0 bg-card p-0 text-content"
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
    </dialog>
  );
}
