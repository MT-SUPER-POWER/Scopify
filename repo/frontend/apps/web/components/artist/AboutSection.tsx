"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { BadgeCheck, X } from "lucide-react";
import { formatNumber } from "@/lib/utils";
import { useI18n } from "@/store/module/i18n";
import type { ArtistInfo } from "@/types/artist";

interface Props {
  artist: ArtistInfo;
}

export function AboutSection({ artist }: Props) {
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);

  const modal = isOpen ? (
    <div
      className="animate-in fade-in fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4 backdrop-blur-md duration-200 md:p-6"
      onClick={() => setIsOpen(false)}
    >
      <div
        className="bg-surface-elevated border-border/40 text-content animate-in zoom-in-95 relative flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border shadow-2xl duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="absolute top-4 right-4 z-20 flex size-9 cursor-pointer items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md transition-colors hover:bg-black/70"
        >
          <X className="size-5" />
        </button>

        {/* Hero Cover Header */}
        <div
          className="relative h-48 w-full shrink-0 bg-cover bg-center sm:h-56"
          style={{ backgroundImage: `url(${artist.headerImageUrl || artist.avatar})` }}
        >
          <div className="from-surface-elevated via-surface-elevated/60 absolute inset-0 bg-linear-to-t to-transparent" />

          {/* Artist Header Info Overlay */}
          <div className="absolute inset-x-0 bottom-0 flex items-end gap-4 p-6">
            <div
              className="border-surface-elevated size-20 shrink-0 rounded-full border-2 bg-cover bg-center shadow-xl sm:size-24"
              style={{ backgroundImage: `url(${artist.avatar})` }}
            />
            <div className="flex flex-col gap-1 pb-1">
              {artist.isVerified && (
                <div className="text-overlay-foreground flex items-center gap-1.5 text-xs font-semibold">
                  <BadgeCheck className="text-brand size-4" fill="var(--overlay-foreground)" />
                  <span>{t("artist.hero.verified")}</span>
                </div>
              )}
              <h3 className="text-overlay-foreground text-2xl font-black tracking-tight sm:text-3xl">
                {artist.name}
              </h3>
              <p className="text-overlay-foreground/80 text-xs font-medium sm:text-sm">
                {t("artist.about.monthlyListeners", { count: formatNumber(artist.listeners) })}
              </p>
            </div>
          </div>
        </div>

        {/* Scrollable Bio Body */}
        <div className="no-scrollbar flex-1 space-y-4 overflow-y-auto p-6">
          <h4 className="text-content text-lg font-bold">{t("artist.about.title")}</h4>
          <div className="text-content/90 space-y-4 text-sm leading-relaxed whitespace-pre-line">
            {artist.bio}
          </div>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      <div className="w-full">
        <h2 className="mb-4 text-2xl font-bold">{t("artist.about.title")}</h2>
        <div
          onClick={() => setIsOpen(true)}
          className="bg-content/5 hover:bg-content/10 group relative cursor-pointer overflow-hidden rounded-xl transition-colors"
        >
          <div
            className="h-64 w-full bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
            style={{ backgroundImage: `url(${artist.avatar})` }}
          />
          <div className="from-overlay via-overlay/50 absolute inset-0 flex flex-col justify-end bg-linear-to-t to-transparent p-5">
            <p className="text-overlay-foreground mb-2 font-bold">
              {t("artist.about.monthlyListeners", { count: formatNumber(artist.listeners) })}
            </p>
            <p className="text-overlay-foreground/80 line-clamp-3 text-sm leading-relaxed">
              {artist.bio}
            </p>
          </div>
        </div>
      </div>

      {typeof document !== "undefined" && modal ? createPortal(modal, document.body) : null}
    </>
  );
}
