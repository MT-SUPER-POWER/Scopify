"use client";

import { motion } from "framer-motion";
import { RotateCcw, Search, Upload } from "lucide-react";
import { useRef } from "react";

import { FoliaLyricTimelineOffsetControl } from "@/components/lyrics/FoliaLyricTimelineOffsetControl";
import { useOnlineLyricsTab } from "@/hooks/lyrics/useOnlineLyricsTab";
import { useI18n } from "@/store/module/i18n";
import type { FoliaLyricsControlsProps } from "@/types/components/lyrics";

export function FoliaLyricsControls({ onOpenLyricMatch, theme }: FoliaLyricsControlsProps) {
  const { t } = useI18n();
  const inputRef = useRef<HTMLInputElement>(null);
  const model = useOnlineLyricsTab();
  const isDaylight = theme.name === "snow";
  const activeTabBg = isDaylight ? "bg-blue-500/15 text-blue-600" : "bg-blue-500/20 text-blue-300";
  const tabContainerBg = isDaylight ? "bg-black/5" : "bg-white/5";
  const activePillBg = isDaylight
    ? "bg-white shadow-[0_2px_8px_rgba(0,0,0,0.06)]"
    : "bg-zinc-800/80 shadow-[0_2px_8px_rgba(0,0,0,0.2)]";
  const activeTextColor = isDaylight
    ? "text-blue-600 font-semibold"
    : "text-blue-300 font-semibold";
  const inactiveTextColor = isDaylight
    ? "text-zinc-500 hover:text-zinc-800"
    : "text-zinc-400 hover:text-zinc-200";
  const sources = [
    { key: "online" as const, label: t("lyrics.match.sourceNetease") },
    ...(model.importedLyric
      ? [{ key: "imported" as const, label: model.importedLyric.fileName }]
      : []),
  ];

  return (
    <motion.div
      animate={{ opacity: 1 }}
      className="flex flex-col px-2 pt-0"
      initial={{ opacity: 0 }}
    >
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="flex items-center gap-1.5 text-[12px] font-bold tracking-widest uppercase opacity-40">
              {t("lyrics.tab.title")}
            </span>
            {model.importedLyric ? (
              <button
                className={`rounded-md p-1 opacity-40 transition-all hover:opacity-100 ${isDaylight ? "hover:bg-black/5" : "hover:bg-white/5"}`}
                disabled={model.isUpdating}
                onClick={() => void model.clearLyricsState()}
                title={t("lyrics.tab.clear")}
                type="button"
              >
                <RotateCcw size={13} />
              </button>
            ) : null}
          </div>
          <div className="flex items-center gap-1">
            <button
              className={`rounded-md p-1 opacity-40 transition-all hover:opacity-100 ${isDaylight ? "hover:bg-black/5" : "hover:bg-white/5"}`}
              onClick={() => inputRef.current?.click()}
              title={t("lyrics.tab.import")}
              type="button"
            >
              <Upload size={14} />
            </button>
            <input
              accept=".lrc,.yrc,.txt"
              className="hidden"
              onChange={(event) => {
                const file = event.currentTarget.files?.[0];
                if (file) void model.importLyricFile(file);
                event.currentTarget.value = "";
              }}
              ref={inputRef}
              type="file"
            />
            <button
              className={`rounded-md p-1 opacity-40 transition-all hover:opacity-100 ${isDaylight ? "hover:bg-black/5" : "hover:bg-white/5"}`}
              onClick={onOpenLyricMatch}
              title={t("lyrics.match.open")}
              type="button"
            >
              <Search size={14} />
            </button>
          </div>
        </div>

        {sources.length === 1 ? (
          <div
            className={`flex items-center justify-between rounded-lg p-2 pl-3 ${isDaylight ? "bg-black/5" : "bg-white/5"}`}
          >
            <span className="text-[11px] opacity-60">{t("lyrics.tab.source")}</span>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${activeTabBg}`}>
              {sources[0].label}
            </span>
          </div>
        ) : (
          <div className={`relative flex rounded-lg p-0.5 ${tabContainerBg}`}>
            {sources.map((source) => {
              const isActive = model.source === source.key;
              return (
                <button
                  className={`relative flex-1 rounded-md px-1.5 py-1 text-[10px] font-medium transition-colors duration-200 focus:outline-none ${isActive ? activeTextColor : inactiveTextColor}`}
                  key={source.key}
                  onClick={() => void model.selectSource(source.key)}
                  type="button"
                >
                  {isActive ? (
                    <motion.span
                      className={`absolute inset-0 rounded-md ${activePillBg}`}
                      layoutId="online-lyrics-active-pill"
                      transition={{ damping: 30, stiffness: 380, type: "spring" }}
                    />
                  ) : null}
                  <span className="relative z-10 truncate">{source.label}</span>
                </button>
              );
            })}
          </div>
        )}

        <FoliaLyricTimelineOffsetControl
          isDaylight={isDaylight}
          offsetMs={model.lyricOffsetMs}
          onOffsetChange={model.setLyricOffsetMs}
        />
      </div>
    </motion.div>
  );
}
