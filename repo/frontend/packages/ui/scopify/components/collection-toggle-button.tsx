"use client";

import { Heart } from "lucide-react";

import { Button } from "@scopify/ui/shadcn/components/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@scopify/ui/shadcn/components/tooltip";
import { cn } from "@scopify/ui/shadcn/lib/utils";
import type { CollectionToggleButtonProps } from "@scopify/ui/scopify/types/components";

export type { CollectionToggleButtonProps } from "@scopify/ui/scopify/types/components";

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
          <Button
            type="button"
            size="icon-lg"
            variant="ghost"
            disabled={isLoading}
            onClick={onToggle}
            aria-label={label}
            aria-busy={isLoading}
            className={cn(
              "group text-content-muted hover:text-content focus-visible:ring-brand/60 inline-flex size-10 items-center justify-center rounded-full transition-all hover:scale-105 focus-visible:ring-2 focus-visible:outline-none disabled:opacity-50",
              isCollected ? "text-brand hover:text-danger" : "hover:bg-content/10",
            )}
          >
            <Heart
              className={cn(
                "size-8 transition-transform group-hover:scale-110",
                isCollected && "fill-current",
              )}
            />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top" sideOffset={8}>
          {label}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
