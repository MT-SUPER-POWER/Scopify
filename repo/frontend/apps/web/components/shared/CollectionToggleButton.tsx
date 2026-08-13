"use client";

import { Heart } from "lucide-react";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { CollectionToggleButtonProps } from "@/types/components/collection";

export function CollectionToggleButton({
  isCollected,
  isLoading,
  onToggle,
  subscribeLabel,
  unsubscribeLabel,
}: CollectionToggleButtonProps) {
  const label = isCollected ? unsubscribeLabel : subscribeLabel;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            disabled={isLoading}
            onClick={onToggle}
            aria-label={label}
            aria-busy={isLoading}
            className={cn(
              "text-content-muted hover:text-content focus-visible:ring-brand/60 group inline-flex size-10 items-center justify-center rounded-full transition-all hover:scale-105 focus-visible:ring-2 focus-visible:outline-none disabled:opacity-50",
              isCollected ? "text-brand hover:text-danger" : "hover:bg-content/10",
            )}
          >
            <Heart
              className={cn(
                "size-8 transition-transform group-hover:scale-110",
                isCollected && "fill-current",
              )}
            />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" sideOffset={8}>
          {label}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
