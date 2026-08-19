"use client";

import { useElementOverflow } from "@scopify/ui/scopify/hooks/use-element-overflow";
import type { ResponsiveTitleProps } from "@scopify/ui/scopify/types/components";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@scopify/ui/shadcn/components/tooltip";
import { cn } from "@scopify/ui/shadcn/lib/utils";

export type { ResponsiveTitleProps } from "@scopify/ui/scopify/types/components";

function getTitleFontSizeClass(title: string): string {
  const length = title.length;
  if (length > 30) return "text-[clamp(1.75rem,4.2cqw,3rem)]";
  if (length > 18) return "text-[clamp(2rem,5.8cqw,3.75rem)]";
  return "text-[clamp(2.5rem,7.5cqw,4.5rem)]";
}

export function ResponsiveTitle({ className, title }: ResponsiveTitleProps) {
  const { elementRef, isOverflowing } = useElementOverflow<HTMLHeadingElement>(title);

  const titleElement = (
    <h1
      ref={elementRef}
      tabIndex={isOverflowing ? 0 : undefined}
      className={cn(
        "text-content focus-visible:ring-brand/50 m-0 w-full truncate leading-none font-black tracking-normal focus-visible:ring-2 focus-visible:outline-none",
        getTitleFontSizeClass(title),
        className,
      )}
    >
      {title}
    </h1>
  );

  if (!isOverflowing) return titleElement;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{titleElement}</TooltipTrigger>
        <TooltipContent side="top" sideOffset={8} className="max-w-lg">
          {title}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
