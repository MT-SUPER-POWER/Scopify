"use client";

import { List } from "lucide-react";
import { PLAYLIST_VIEW_MODES } from "@/constants/playlistViews";
import { cn } from "@/lib/utils";
import { useLatticePreferences, useLatticeView } from "@/store/module/lattice";
import { headerStyles } from "@/styles";
import { useTranslation } from "react-i18next";

const BUTTON =
  "flex size-8 items-center justify-center rounded-full text-content-muted transition-colors hover:bg-surface-elevated hover:text-content focus-visible:outline-2 focus-visible:outline-brand [&_svg]:size-4";

/** Shown in the header while an immersive playlist view is open: back to the list, or jump to another view. */
export function HeaderViewSwitch() {
  const { t } = useTranslation();
  const controller = useLatticeView((state) => state.controller);
  const mode = useLatticePreferences((state) => state.viewMode);
  if (!controller) return null;
  return (
    <div
      role="group"
      aria-label={t("playlist.view.open")}
      className={cn(
        headerStyles.noDrag,
        "flex items-center gap-0.5 rounded-full bg-surface-sunken/80 p-0.5",
      )}
    >
      <button
        type="button"
        onClick={controller.close}
        aria-label={t("playlist.lattice.back")}
        title={`${t("playlist.lattice.back")} · Esc`}
        className={BUTTON}
      >
        <List />
      </button>
      {PLAYLIST_VIEW_MODES.map(({ mode: value, icon: Icon, labelKey }) => (
        <button
          key={value}
          type="button"
          onClick={() => controller.open(value)}
          aria-label={t(labelKey)}
          aria-pressed={mode === value}
          title={t(labelKey)}
          className={cn(BUTTON, mode === value && "bg-surface-elevated text-content shadow-sm")}
        >
          <Icon />
        </button>
      ))}
    </div>
  );
}
