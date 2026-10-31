"use client";

import { PanelsTopLeft } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@scopify/ui/shadcn/components/tooltip";
import { useTranslation } from "react-i18next";

import type { PlaylistViewButtonProps } from "@/types/playlist/latticeComponents";

export function PlaylistViewButton({ onOpen, disabled }: PlaylistViewButtonProps) {
  const { t } = useTranslation();
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={onOpen}
          disabled={disabled}
          aria-label={t("playlist.lattice.open")}
          className="inline-flex size-9 items-center justify-center rounded-full text-content-muted transition-colors hover:bg-content/10 hover:text-content focus-visible:outline-2 focus-visible:outline-brand disabled:opacity-30"
        >
          <PanelsTopLeft className="size-5" />
        </button>
      </TooltipTrigger>
      <TooltipContent>{t("playlist.lattice.open")}</TooltipContent>
    </Tooltip>
  );
}
