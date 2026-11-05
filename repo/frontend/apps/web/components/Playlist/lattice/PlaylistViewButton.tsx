"use client";

import { PanelsTopLeft } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@scopify/ui/shadcn/components/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@scopify/ui/shadcn/components/tooltip";
import { useTranslation } from "react-i18next";

import { PLAYLIST_VIEW_MODES } from "@/constants/playlistViews";
import type { PlaylistViewButtonProps } from "@/types/playlist/latticeComponents";

export function PlaylistViewButton({ onOpen, disabled }: PlaylistViewButtonProps) {
  const { t } = useTranslation();
  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              disabled={disabled}
              aria-label={t("playlist.view.open")}
              className="inline-flex size-9 items-center justify-center rounded-full text-content-muted transition-colors hover:bg-content/10 hover:text-content focus-visible:outline-2 focus-visible:outline-brand disabled:opacity-30"
            >
              <PanelsTopLeft className="size-5" />
            </button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>{t("playlist.view.open")}</TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="end" className="w-48">
        {PLAYLIST_VIEW_MODES.map(({ mode, icon: Icon, labelKey }) => (
          <DropdownMenuItem key={mode} onSelect={() => onOpen(mode)}>
            <Icon />
            {t(labelKey)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
