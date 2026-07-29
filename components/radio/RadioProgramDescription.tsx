"use client";

import { Disc3, Music2 } from "lucide-react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { useState } from "react";

import { MediaDescriptionDialog } from "@/components/shared/MediaDescriptionDialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useI18n } from "@/store/module/i18n";

interface RadioProgramDescriptionProps {
  cover?: string;
  description?: string;
  title: string;
}

export function RadioProgramDescription({
  cover,
  description,
  title,
}: RadioProgramDescriptionProps) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const content = description?.trim();

  if (!content) return null;

  return (
    <>
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="dialog"
        className="block w-full truncate text-left text-sm text-zinc-500 transition-colors hover:text-zinc-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1ed760]"
        onClick={(event) => {
          event.stopPropagation();
          setOpen(true);
        }}
        onDoubleClick={(event) => event.stopPropagation()}
      >
        {content}
        <span className="sr-only"> — {t("library.podcasts.action.showDescription")}</span>
      </button>
      <MediaDescriptionDialog
        closeLabel={t("library.podcasts.description.close")}
        header={
          <div className="relative shrink-0 overflow-hidden border-b border-white/10">
            {cover && (
              <img
                aria-hidden="true"
                src={cover}
                alt=""
                className="absolute inset-0 size-full scale-110 object-cover opacity-45 blur-2xl"
              />
            )}
            <div className="absolute inset-0 bg-linear-to-r from-black/75 via-black/60 to-black/80" />
            <div className="absolute inset-0 bg-linear-to-t from-[#151515] via-transparent to-black/15" />

            <div className="relative flex items-end gap-5 px-5 pt-14 pb-6 sm:gap-7 sm:px-8 sm:pt-16 sm:pb-8">
              <div className="size-28 shrink-0 overflow-hidden rounded-xl bg-white/5 shadow-[0_16px_48px_rgba(0,0,0,0.45)] ring-1 ring-white/10 sm:size-36">
                {cover ? (
                  <img src={cover} alt={title} className="size-full object-cover" />
                ) : (
                  <div className="flex size-full items-center justify-center text-white/25">
                    <Music2 className="size-10" />
                  </div>
                )}
              </div>

              <div className="min-w-0 pb-1">
                <span className="mb-3 inline-flex rounded-full border border-white/10 bg-white/10 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-white/80 backdrop-blur-sm">
                  {t("library.title.podcasts")}
                </span>
                <DialogPrimitive.Title className="line-clamp-2 text-2xl leading-tight font-bold tracking-tight text-balance sm:text-4xl">
                  {title}
                </DialogPrimitive.Title>
                <DialogPrimitive.Description className="sr-only">
                  {content}
                </DialogPrimitive.Description>
              </div>
            </div>
          </div>
        }
        open={open}
        onOpenChange={setOpen}
      >
        <ScrollArea className="h-full min-h-0">
          <article className="px-5 py-6 sm:p-8">
            <div className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.18em] text-white/40 uppercase">
              <Disc3 className="size-3.5" />
              {t("library.podcasts.description.title")}
            </div>
            <p className="mt-4 text-[15px] leading-7 whitespace-pre-wrap text-zinc-200 sm:text-base sm:leading-8">
              {content}
            </p>
          </article>
        </ScrollArea>
      </MediaDescriptionDialog>
    </>
  );
}
