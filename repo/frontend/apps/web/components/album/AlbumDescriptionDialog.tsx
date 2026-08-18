"use client";

import { CalendarDays, Disc3, Music2 } from "lucide-react";
import Image from "next/image";
import { Dialog as DialogPrimitive } from "radix-ui";

import { MediaDescriptionDialog } from "@/components/shared/MediaDescriptionDialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useI18n } from "@/store/module/i18n";
import type { AlbumDescriptionDialogProps } from "@/types/components/album";

export function AlbumDescriptionDialog({ info, onOpenChange, open }: AlbumDescriptionDialogProps) {
  const { t } = useI18n();

  return (
    <MediaDescriptionDialog
      closeLabel={t("album.description.close")}
      header={
        <div className="relative shrink-0 overflow-hidden border-b border-border">
          {info.cover && (
            <Image
              fill
              aria-hidden
              alt=""
              src={info.cover}
              sizes="54rem"
              className="scale-110 object-cover opacity-45 blur-2xl"
            />
          )}
          <div className="absolute inset-0 bg-linear-to-r from-overlay via-overlay/75 to-overlay" />
          <div className="absolute inset-0 bg-linear-to-t from-surface-overlay via-transparent to-overlay/20" />

          <div className="relative flex items-end gap-5 px-5 pt-14 pb-6 sm:gap-7 sm:px-8 sm:pt-16 sm:pb-8">
            <div className="size-28 shrink-0 overflow-hidden rounded-xl bg-content/5 shadow-floating ring-1 ring-content/10 sm:size-36">
              {info.cover ? (
                <Image
                  width={288}
                  height={288}
                  src={info.cover}
                  alt={t("album.coverAlt")}
                  className="size-full object-cover"
                />
              ) : (
                <div className="flex size-full items-center justify-center text-overlay-foreground/25">
                  <Music2 className="size-10" />
                </div>
              )}
            </div>

            <div className="min-w-0 pb-1">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-overlay-foreground/10 bg-content/10 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-overlay-foreground/80 backdrop-blur-sm">
                  {info.type || t("album.meta.type")}
                </span>
                {info.subType && (
                  <span className="rounded-full border border-overlay-foreground/10 bg-overlay/25 px-2.5 py-1 text-[11px] text-overlay-foreground/60 backdrop-blur-sm">
                    {info.subType}
                  </span>
                )}
              </div>

              <DialogPrimitive.Title className="line-clamp-2 text-2xl leading-tight font-bold tracking-tight text-balance text-overlay-foreground sm:text-4xl">
                {info.title}
              </DialogPrimitive.Title>
              <DialogPrimitive.Description className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-overlay-foreground/65 sm:text-sm">
                <span className="font-medium text-overlay-foreground/90">{info.artistName}</span>
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="size-3.5" />
                  {info.releaseYear}
                </span>
                <span className="flex items-center gap-1.5">
                  <Disc3 className="size-3.5" />
                  {t("album.totalSongs", { count: info.totalSongs })}
                </span>
              </DialogPrimitive.Description>
            </div>
          </div>
        </div>
      }
      open={open}
      onOpenChange={onOpenChange}
    >
      <ScrollArea className="h-full min-h-0">
        <article className="px-5 py-6 sm:p-8">
          <div className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.18em] text-content/40 uppercase">
            <Disc3 className="size-3.5" />
            {t("album.description.title")}
          </div>
          <p className="mt-4 text-[15px] leading-7 whitespace-pre-wrap text-content sm:text-base sm:leading-8">
            {info.description}
          </p>

          {info.company && (
            <div className="mt-8 flex items-start gap-4 border-t border-content/8 pt-5 text-sm">
              <span className="shrink-0 text-content-subtle">{t("album.meta.publisher")}</span>
              <span className="text-content-muted">{info.company}</span>
            </div>
          )}
        </article>
      </ScrollArea>
    </MediaDescriptionDialog>
  );
}
