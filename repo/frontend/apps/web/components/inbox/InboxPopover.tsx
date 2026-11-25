"use client";

import { X } from "lucide-react";
import { PopoverArrow } from "@scopify/ui/scopify/components/popover-arrow";
import { Popover, PopoverContent, PopoverTrigger } from "@scopify/ui/shadcn/components/popover";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@scopify/ui/shadcn/components/sheet";
import { useIsMobile } from "@scopify/ui/shadcn/hooks/use-mobile";
import { useTranslation } from "react-i18next";

import type { InboxPopoverProps } from "@/types/messages/inboxComponents";

export function InboxPopover({
  children,
  trigger,
  title,
  description,
  open,
  onOpenChange,
  alignOffset = -80,
}: InboxPopoverProps) {
  const mobile = useIsMobile();
  const { t } = useTranslation();
  if (mobile)
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetTrigger asChild>{trigger}</SheetTrigger>
        <SheetContent
          side="bottom"
          showCloseButton={false}
          className="gap-0 rounded-t-2xl border-border bg-popover p-0 pb-[env(safe-area-inset-bottom)]"
        >
          <SheetTitle className="sr-only">{title}</SheetTitle>
          <SheetDescription className="sr-only">{description ?? title}</SheetDescription>
          <div className="flex justify-end px-4 pt-2">
            <SheetClose asChild>
              <button
                type="button"
                aria-label={t("common.action.close")}
                className="rounded-full p-2 text-content-muted"
              >
                <X className="size-4" />
              </button>
            </SheetClose>
          </div>
          {children}
        </SheetContent>
      </Sheet>
    );
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="end"
        alignOffset={alignOffset}
        sideOffset={8}
        arrowPadding={20}
        collisionPadding={12}
        aria-label={title}
        className="w-[min(440px,calc(100vw-24px))] rounded-2xl border-border bg-popover p-0 shadow-floating"
      >
        <div className="overflow-hidden rounded-[inherit]">{children}</div>
        <PopoverArrow width={20} height={10} />
      </PopoverContent>
    </Popover>
  );
}
