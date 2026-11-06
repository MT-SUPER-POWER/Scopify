"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Crosshair, List, Settings2, X, ZoomIn, ZoomOut } from "lucide-react";
import { Switch } from "@scopify/ui/shadcn/components/switch";
import { PLAYLIST_VIEW_MODES } from "@/constants/playlistViews";
import { ZOOM_STEP } from "@/lib/playlist/zoomKeys";
import { cn } from "@/lib/utils";
import { useLatticePreferences } from "@/store/module/lattice";
import { useTranslation } from "react-i18next";

import type { PlaylistViewToolsProps } from "@/types/playlist/latticeComponents";

const ROW =
  "flex h-[38px] w-full items-center gap-2.5 rounded-xl px-2.5 text-left text-[13px] transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-white/70 disabled:opacity-35 disabled:hover:bg-transparent [&_svg]:size-4 [&_svg]:shrink-0";
const CELL =
  "grid h-10 place-items-center rounded-xl transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-white/70 [&_svg]:size-[18px]";

/**
 * The floating tool ball at the bottom right of every immersive view, like Folia's wall tools: click
 * it for a glass panel with the view switch, zoom and the view's own options. It sits inside the
 * pane, clear of the player bar.
 */
export function PlaylistViewTools({
  title,
  count,
  mode,
  onModeChange,
  hint,
  onZoom,
  canLocate,
  onLocate,
  onClose,
}: PlaylistViewToolsProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const preferences = useLatticePreferences();
  useEffect(() => {
    if (!open) return;
    const away = (event: PointerEvent) => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", away);
    return () => document.removeEventListener("pointerdown", away);
  }, [open]);
  return (
    <div
      ref={rootRef}
      data-playlist-view-tools=""
      className="absolute right-6 bottom-6 z-30 flex flex-col items-end gap-2 text-white"
      onKeyDown={(event) => {
        if (event.key !== "Escape" || !open) return;
        event.preventDefault();
        event.stopPropagation();
        setOpen(false);
      }}
    >
      <h1 className="sr-only">
        {title} · {count}
      </h1>
      <AnimatePresence>
        {open && (
          <motion.div
            id="playlist-view-tools-panel"
            role="group"
            aria-label={t("playlist.view.tools")}
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
            className="w-[min(296px,calc(100vw-48px))] origin-bottom-right rounded-2xl border border-white/10 bg-[#151515]/85 p-1.5 shadow-[0_24px_64px_#000a] backdrop-blur-xl"
          >
            <div className="grid grid-cols-4 gap-1 p-0.5">
              <button
                type="button"
                className={CELL}
                onClick={onClose}
                aria-label={t("playlist.lattice.back")}
                title={`${t("playlist.lattice.back")} · Esc`}
              >
                <List />
              </button>
              {PLAYLIST_VIEW_MODES.map(({ mode: value, icon: Icon, labelKey }) => (
                <button
                  key={value}
                  type="button"
                  className={cn(CELL, mode === value && "bg-white/16")}
                  onClick={() => onModeChange(value)}
                  aria-label={t(labelKey)}
                  aria-pressed={mode === value}
                  title={t(labelKey)}
                >
                  <Icon />
                </button>
              ))}
            </div>
            <div className="mt-1 flex h-[38px] items-center justify-between rounded-xl px-2.5 text-[13px]">
              <span>{t("playlist.view.zoom")}</span>
              <span className="flex items-center gap-0.5">
                <button
                  type="button"
                  className="grid size-8 place-items-center rounded-lg hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-white/70 [&_svg]:size-4"
                  onClick={() => onZoom(1 / ZOOM_STEP)}
                  aria-label={t("playlist.view.zoomOut")}
                  title={`${t("playlist.view.zoomOut")} · -`}
                >
                  <ZoomOut />
                </button>
                <button
                  type="button"
                  className="grid size-8 place-items-center rounded-lg hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-white/70 [&_svg]:size-4"
                  onClick={() => onZoom(ZOOM_STEP)}
                  aria-label={t("playlist.view.zoomIn")}
                  title={`${t("playlist.view.zoomIn")} · +`}
                >
                  <ZoomIn />
                </button>
              </span>
            </div>
            <button type="button" className={ROW} disabled={!canLocate} onClick={onLocate}>
              <Crosshair />
              {t("playlist.lattice.locate")}
            </button>
            <label className={cn(ROW, "cursor-pointer justify-between")}>
              {t("playlist.lattice.follow")}
              <Switch
                checked={preferences.followCurrent}
                onCheckedChange={preferences.setFollowCurrent}
              />
            </label>
            <label className={cn(ROW, "cursor-pointer justify-between")}>
              {t("playlist.lattice.lightsOff")}
              <Switch checked={preferences.lightsOff} onCheckedChange={preferences.setLightsOff} />
            </label>
            <p className="mt-1 border-t border-white/10 px-2.5 pt-2 pb-1.5 text-[11px] leading-relaxed text-white/55">
              {hint}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls="playlist-view-tools-panel"
        aria-label={t("playlist.view.tools")}
        title={t("playlist.view.tools")}
        className="grid size-11 place-items-center rounded-full border border-white/10 bg-[#151515]/80 shadow-[0_8px_24px_#0007] backdrop-blur-md transition-[background-color,transform] duration-200 hover:bg-[#262626] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/80 active:scale-95 [&_svg]:size-5"
      >
        {open ? <X /> : <Settings2 />}
      </button>
    </div>
  );
}
