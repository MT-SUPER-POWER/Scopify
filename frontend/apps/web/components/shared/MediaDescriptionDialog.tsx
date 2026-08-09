"use client";

import { X } from "lucide-react";
import { Dialog as DialogPrimitive } from "radix-ui";
import type { ReactNode } from "react";

interface MediaDescriptionDialogProps {
  children: ReactNode;
  closeLabel: string;
  header: ReactNode;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}

export function MediaDescriptionDialog({
  children,
  closeLabel,
  header,
  onOpenChange,
  open,
}: MediaDescriptionDialogProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        {/* The Tailwind ESLint sorter conflicts with the repository's Prettier Tailwind order here. */}
        {/* eslint-disable-next-line tailwindcss/classnames-order */}
        <DialogPrimitive.Overlay className="bg-overlay data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0 fixed inset-0 z-50 backdrop-blur-md" />
        {/* eslint-disable-next-line tailwindcss/classnames-order */}
        <DialogPrimitive.Content className="bg-surface-overlay text-content shadow-floating data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 fixed top-1/2 left-1/2 z-50 grid h-[min(82vh,44rem)] w-[min(54rem,calc(100%-2rem))] -translate-1/2 grid-rows-[auto_minmax(0,1fr)] overflow-hidden rounded-2xl border duration-200 outline-none">
          <DialogPrimitive.Close
            aria-label={closeLabel}
            className="bg-overlay/50 text-overlay-foreground/70 border-content/10 hover:bg-overlay/75 hover:text-overlay-foreground focus-visible:ring-brand/60 absolute top-4 right-4 z-20 flex size-9 items-center justify-center rounded-full border backdrop-blur-md transition-colors focus-visible:ring-2 focus-visible:outline-none"
          >
            <X className="size-4" />
          </DialogPrimitive.Close>
          {header}
          {children}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
