"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@scopify/ui/shadcn/components/dialog";
import { useI18n } from "@/store/module/i18n";
import type { SocialEventProps } from "@/types/components/social";
import s from "./Social.module.css";

export function SocialEventMedia({ event }: SocialEventProps) {
  const { t } = useI18n();
  const [selected, setSelected] = useState<number>();
  const count = event.pictures.length;
  return (
    <>
      <div className={s.pictures} data-count={Math.min(count, 4)}>
        {event.pictures.slice(0, 4).map((url, index) => (
          <button
            type="button"
            key={url + index}
            onClick={() => setSelected(index)}
            aria-label={t("social.picture", { index: index + 1 })}
          >
            <img
              src={url}
              alt={t("social.picture", { index: index + 1 })}
              loading="lazy"
              referrerPolicy="no-referrer"
            />
            {index === 3 && count > 4 && <span className={s.morePictures}>+{count - 4}</span>}
          </button>
        ))}
      </div>
      <Dialog
        open={selected !== undefined}
        onOpenChange={(open) => {
          if (!open) setSelected(undefined);
        }}
      >
        <DialogContent className={s.dialog + " sm:max-w-4xl"}>
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
                <div className={s.galleryNavigation}>
                  <button
                    type="button"
                    className={s.iconButton}
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
                    className={s.iconButton}
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
