"use client";

import { Crosshair, List, SlidersHorizontal, ListMusic } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@scopify/ui/shadcn/components/dropdown-menu";
import { useI18n } from "@/store/module/i18n";
import { useUiStore } from "@/store/module/ui";
import { useLatticePreferences } from "@/store/module/lattice";
import type { LatticeToolbarProps } from "@/types/components/playlistLattice";
import styles from "./PlaylistLattice.module.css";

export function LatticeToolbar({
  title,
  count,
  canLocate,
  onLocate,
  onClose,
}: LatticeToolbarProps) {
  const { t } = useI18n();
  const preferences = useLatticePreferences();
  return (
    <header className={styles.toolbar}>
      <h1 className="sr-only">
        {title} · {count}
      </h1>
      <div className={styles.tools}>
        <button
          type="button"
          onClick={onClose}
          aria-label={t("playlist.lattice.back")}
          title={`${t("playlist.lattice.back")} · Esc`}
        >
          <List size={17} />
        </button>
        {canLocate && (
          <button
            type="button"
            onClick={onLocate}
            title={t("playlist.lattice.locate")}
            aria-label={t("playlist.lattice.locate")}
          >
            <Crosshair size={17} />
          </button>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label={t("playlist.lattice.options")}
              title={t("playlist.lattice.options")}
            >
              <SlidersHorizontal size={17} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            side="top"
            sideOffset={12}
            className="w-64 rounded-xl p-2"
            onKeyDown={(event) => event.stopPropagation()}
          >
            <DropdownMenuLabel className="truncate text-xs text-muted-foreground">
              {title} · {count}
            </DropdownMenuLabel>
            <DropdownMenuItem disabled={!canLocate} onSelect={onLocate}>
              <Crosshair />
              {t("playlist.lattice.locate")}
            </DropdownMenuItem>
            <DropdownMenuCheckboxItem
              checked={preferences.followCurrent}
              onCheckedChange={preferences.setFollowCurrent}
            >
              {t("playlist.lattice.follow")}
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={preferences.lightsOff}
              onCheckedChange={preferences.setLightsOff}
            >
              {t("playlist.lattice.lightsOff")}
            </DropdownMenuCheckboxItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => useUiStore.getState().setIsQueueOpen(true)}>
              <ListMusic />
              {t("queue.title")}
            </DropdownMenuItem>
            <p className="p-2 text-xs leading-relaxed text-muted-foreground">
              {t("playlist.lattice.hint")}
            </p>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
