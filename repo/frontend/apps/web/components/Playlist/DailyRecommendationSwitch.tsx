"use client";

import { ArrowLeftRight } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@scopify/ui/shadcn/components/tooltip";
import type { DailyRecommendationSwitchProps } from "@/types/playlist/components";

export function DailyRecommendationSwitch({ label, onClick }: DailyRecommendationSwitchProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={label}
          onClick={onClick}
          className="inline-flex size-9 items-center justify-center rounded-full text-content-muted transition-colors hover:bg-content/10 hover:text-content focus-visible:outline-2 focus-visible:outline-brand"
        >
          <ArrowLeftRight className="size-5" />
        </button>
      </TooltipTrigger>
      <TooltipContent sideOffset={6}>{label}</TooltipContent>
    </Tooltip>
  );
}
