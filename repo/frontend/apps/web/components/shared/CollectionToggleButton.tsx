"use client";

import { Heart } from "lucide-react";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@scopify/ui/shadcn/components/tooltip";
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
              "group inline-flex size-10 items-center justify-center rounded-full text-content-muted transition-all hover:scale-105 hover:text-content focus-visible:ring-2 focus-visible:ring-brand/60 focus-visible:outline-none disabled:opacity-50",
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
