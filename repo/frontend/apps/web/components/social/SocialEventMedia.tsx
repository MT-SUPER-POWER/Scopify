"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@scopify/ui/shadcn/components/dialog";
import { useTranslation } from "react-i18next";

import type { SocialEventProps } from "@/types/social/components";
import { cn } from "@/lib/utils";
import { socialDialogClass, socialIconButtonClass } from "./socialClasses";

/** 配图网格：1 张按原比例收进 320×320 的框，2 张方图，3 张左大右二，4 张田字。 */
function pictureGridClass(count: number) {
  return cn(
    "mt-3 grid max-w-105 grid-cols-2 gap-[5px] overflow-hidden rounded-[10px]",
    count === 1 && "block w-fit max-w-[min(100%,320px)]",
    count >= 3 && "max-h-75 @max-[500px]:max-h-60",
  );
}
function pictureButtonClass(count: number, index: number) {
  return cn(
    "relative aspect-[1.25] w-full overflow-hidden bg-secondary",
    count === 1 && "block aspect-auto max-h-80 w-auto max-w-full rounded-[10px]",
    count === 2 && "aspect-square",
    count >= 3 && "aspect-auto h-[147px] @max-[500px]:h-[117px]",
    count === 3 && index === 0 && "row-span-2 h-75 @max-[500px]:h-60",
  );
}
function pictureImageClass(count: number) {
  return count === 1
    ? "block h-auto max-h-[320px] w-auto max-w-full object-contain"
    : "size-full object-cover";
}

export function SocialEventMedia({ event }: SocialEventProps) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<number>();
  const count = event.pictures.length;
  return (
    <>
      <div className={pictureGridClass(Math.min(count, 4))} data-count={Math.min(count, 4)}>
        {event.pictures.slice(0, 4).map((url, index) => (
          <button
            type="button"
            key={url + index}
            className={pictureButtonClass(Math.min(count, 4), index)}
            onClick={() => setSelected(index)}
            aria-label={t("social.picture", { index: index + 1 })}
          >
            <img
              src={url}
              alt={t("social.picture", { index: index + 1 })}
              loading="lazy"
              referrerPolicy="no-referrer"
              className={pictureImageClass(Math.min(count, 4))}
            />
            {index === 3 && count > 4 && (
              <span className="absolute inset-0 grid place-items-center bg-background/60 text-[28px] font-[650] text-foreground">
                +{count - 4}
              </span>
            )}
          </button>
        ))}
      </div>
      <Dialog
        open={selected !== undefined}
        onOpenChange={(open) => {
          if (!open) setSelected(undefined);
        }}
      >
        <DialogContent className={cn(socialDialogClass, "sm:max-w-4xl")}>
          <DialogTitle className="sr-only">
            {t("social.picture", { index: (selected ?? 0) + 1 })}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {event.title || event.text || t("social.unknownPost")}
          </DialogDescription>
          {selected !== undefined && (
            <>
              <img
                src={event.pictures[selected]}
                alt={t("social.picture", { index: selected + 1 })}
                referrerPolicy="no-referrer"
                className="max-h-[65dvh] w-full object-contain"
              />
              {count > 1 && (
                <div className="flex items-center justify-center gap-[22px] text-[13px] text-muted-foreground">
                  <button
                    type="button"
                    className={socialIconButtonClass}
                    disabled={selected === 0}
                    aria-label={t("social.previousImage")}
                    onClick={() => setSelected(selected - 1)}
                  >
                    <ChevronLeft />
                  </button>
                  <span aria-live="polite">
                    {selected + 1} / {count}
                  </span>
                  <button
                    type="button"
                    className={socialIconButtonClass}
                    disabled={selected === count - 1}
                    aria-label={t("social.nextImage")}
                    onClick={() => setSelected(selected + 1)}
                  >
                    <ChevronRight />
                  </button>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
