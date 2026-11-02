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
import { useTranslation } from "react-i18next";

import { useUiStore } from "@/store/module/ui";
import { useLatticePreferences } from "@/store/module/lattice";
import type { LatticeToolbarProps } from "@/types/playlist/latticeComponents";

const toolButtonClass =
  "flex h-[38px] min-w-[38px] cursor-pointer items-center justify-center gap-[7px] rounded-full bg-[#151515cc] px-2.5 text-[12px] text-white transition-[color,background-color] duration-200 ease-[ease] hover:bg-secondary hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

export function LatticeToolbar({
  title,
  count,
  canLocate,
  onLocate,
  onClose,
}: LatticeToolbarProps) {
  const { t } = useTranslation();
  const preferences = useLatticePreferences();
  return (
    <header className="absolute right-0 bottom-0 z-3 flex items-center pt-8 pr-[18px] pb-[18px] pl-8 opacity-0 transition-opacity duration-200 ease-[ease] focus-within:opacity-100 hover:opacity-100 has-[button[data-state=open]]:opacity-100 @max-[620px]:px-3 @max-[620px]:pt-6 @max-[620px]:pb-3 [@media(hover:none)]:opacity-100">
      <h1 className="sr-only">
        {title} · {count}
      </h1>
      <div className="flex shrink-0 items-center gap-1.5">
        <button
          type="button"
          className={toolButtonClass}
          onClick={onClose}
          aria-label={t("playlist.lattice.back")}
          title={`${t("playlist.lattice.back")} · Esc`}
        >
          <List size={17} />
        </button>
        {canLocate && (
          <button
            type="button"
            className={toolButtonClass}
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
              className={toolButtonClass}
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
