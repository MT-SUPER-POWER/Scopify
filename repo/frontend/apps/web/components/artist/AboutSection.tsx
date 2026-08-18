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
      className="fixed inset-0 z-100 flex animate-in items-center justify-center bg-overlay/75 p-4 backdrop-blur-md duration-200 fade-in md:p-6"
      onClick={() => setIsOpen(false)}
    >
      <div
        className="relative flex max-h-[88vh] w-full max-w-2xl animate-in flex-col overflow-hidden rounded-2xl border border-border/40 bg-surface-elevated text-content shadow-2xl duration-200 zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="absolute top-4 right-4 z-20 flex size-9 cursor-pointer items-center justify-center rounded-full bg-overlay/40 text-overlay-foreground backdrop-blur-md transition-colors hover:bg-overlay/70"
        >
          <X className="size-5" />
        </button>

        {/* Hero Cover Header */}
        <div
          className="relative h-48 w-full shrink-0 bg-cover bg-center sm:h-56"
          style={{ backgroundImage: `url(${artist.headerImageUrl || artist.avatar})` }}
        >
          <div className="absolute inset-0 bg-linear-to-t from-surface-elevated via-surface-elevated/60 to-transparent" />

          {/* Artist Header Info Overlay */}
          <div className="absolute inset-x-0 bottom-0 flex items-end gap-4 p-6">
            <div
              className="size-20 shrink-0 rounded-full border-2 border-surface-elevated bg-cover bg-center shadow-xl sm:size-24"
              style={{ backgroundImage: `url(${artist.avatar})` }}
            />
            <div className="flex flex-col gap-1 pb-1">
              {artist.isVerified && (
                <div className="flex items-center gap-1.5 text-xs font-semibold text-overlay-foreground">
                  <BadgeCheck className="size-4 text-brand" fill="var(--overlay-foreground)" />
                  <span>{t("artist.hero.verified")}</span>
                </div>
              )}
              <h3 className="text-2xl font-black tracking-tight text-overlay-foreground sm:text-3xl">
                {artist.name}
              </h3>
              <p className="text-xs font-medium text-overlay-foreground/80 sm:text-sm">
                {t("artist.about.monthlyListeners", { count: formatNumber(artist.listeners) })}
              </p>
            </div>
          </div>
        </div>

        {/* Scrollable Bio Body */}
        <div className="no-scrollbar flex-1 space-y-4 overflow-y-auto p-6">
          <h4 className="text-lg font-bold text-content">{t("artist.about.title")}</h4>
          <div className="space-y-4 text-sm leading-relaxed whitespace-pre-line text-content/90">
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
          className="group relative cursor-pointer overflow-hidden rounded-xl bg-content/5 transition-colors hover:bg-content/10"
        >
          <div
            className="h-64 w-full bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
            style={{ backgroundImage: `url(${artist.avatar})` }}
          />
          <div className="absolute inset-0 flex flex-col justify-end bg-linear-to-t from-overlay via-overlay/50 to-transparent p-5">
            <p className="mb-2 font-bold text-overlay-foreground">
              {t("artist.about.monthlyListeners", { count: formatNumber(artist.listeners) })}
            </p>
            <p className="line-clamp-3 text-sm leading-relaxed text-overlay-foreground/80">
              {artist.bio}
            </p>
          </div>
        </div>
      </div>

      {typeof document !== "undefined" && modal ? createPortal(modal, document.body) : null}
    </>
  );
}
