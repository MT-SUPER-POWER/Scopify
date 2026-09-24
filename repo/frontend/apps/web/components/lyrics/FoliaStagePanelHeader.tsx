"use client";

import { Disc, ListMusic, RadioTower, Settings2, SlidersHorizontal, X } from "lucide-react";
import { useI18n } from "@/store/module/i18n";
import { usePlayerStore } from "@/store/module/player";
import type { FoliaStagePanelHeaderProps } from "@/types/components/lyrics";

export function FoliaStagePanelHeader({
  activeTab,
  isPersonalFm,
  onClose,
  onTabChange,
  theme,
}: FoliaStagePanelHeaderProps) {
  const { t } = useI18n();
  const currentSong = usePlayerStore((state) => state.currentSongDetail);
  const isDaylight = theme.name === "snow";
  const panelTabs = [
    ["controls", SlidersHorizontal, "folia.panel.controls"],
    ["queue", ListMusic, "folia.queue.title"],
    ...(isPersonalFm ? ([["fm", RadioTower, "personalFm.title"]] as const) : []),
    ["settings", Settings2, "folia.options.visualSettings"],
  ] as const;

  return (
    <>
      {/* 封面 — 固定，不滚动 */}
      <div className="shrink-0 p-5 pb-3">
        <div
          className={`relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-2xl shadow-lg ${
            isDaylight ? "bg-black/3" : "bg-white/5"
          }`}
        >
          {currentSong?.al.picUrl ? (
            <img src={currentSong.al.picUrl} alt="" className="size-full object-cover" />
          ) : (
            <Disc size={40} className={isDaylight ? "text-black/20" : "text-white/20"} />
          )}
          <button
            type="button"
            title={String(t("folia.ui.close"))}
            onClick={() => onClose()}
            className={`absolute top-3 right-3 flex size-11 items-center justify-center rounded-full border backdrop-blur-md ${
              isDaylight
                ? "border-black/10 bg-white/70 text-zinc-700 hover:bg-white"
                : "border-white/15 bg-black/25 text-white/90 hover:bg-black/40"
            }`}
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Tab 切换栏 — 固定，不滚动 */}
      <div className="shrink-0 px-5 pb-3">
        <div className={`flex rounded-xl p-1 ${isDaylight ? "bg-black/5" : "bg-black/20"}`}>
          {panelTabs.map(([tab, Icon, label]) => (
            <button
              key={tab}
              type="button"
              title={String(t(label))}
              onClick={() => onTabChange(tab)}
              className={`flex flex-1 items-center justify-center rounded-lg py-2 transition-all ${
                activeTab === tab
                  ? isDaylight
                    ? "bg-black/10 shadow-sm"
                    : "bg-white/20 shadow-sm"
                  : "opacity-40 hover:opacity-100"
              }`}
              style={{ color: theme.primaryColor }}
            >
              <Icon size={16} />
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
