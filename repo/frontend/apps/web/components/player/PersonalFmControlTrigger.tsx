"use client";

import { forwardRef, type ComponentPropsWithoutRef } from "react";
import { Loader2, RadioTower } from "lucide-react";

import { cn } from "@/lib/utils";

interface PersonalFmControlTriggerProps extends ComponentPropsWithoutRef<"button"> {
  ariaLabel: string;
  iconClassName: string;
  isLoading: boolean;
}

export const PersonalFmControlTrigger = forwardRef<
  HTMLButtonElement,
  PersonalFmControlTriggerProps
>(function PersonalFmControlTrigger(
  { ariaLabel, className, iconClassName, isLoading, ...buttonProps },
  ref,
) {
  const statusIcon = isLoading ? (
    <Loader2 className={cn("shrink-0 animate-spin", iconClassName)} />
  ) : (
    <RadioTower className={cn("shrink-0", iconClassName)} />
  );

  return (
    <button
      {...buttonProps}
      ref={ref}
      type="button"
      aria-label={ariaLabel}
      className={cn(
        "inline-flex shrink-0 cursor-pointer items-center justify-center text-content-muted transition-colors hover:text-content",
        className,
      )}
    >
      {statusIcon}
    </button>
  );
});
