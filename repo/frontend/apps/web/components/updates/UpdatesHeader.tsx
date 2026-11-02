"use client";

import { X } from "lucide-react";
import { DialogDescription, DialogTitle } from "@scopify/ui/shadcn/components/dialog";
import { UPDATES, UPDATES_CHANGELOG_URL } from "@/constants/updates";
import { useTranslation } from "react-i18next";
import { useI18nStore } from "@/store/module/i18n";
import type { UpdatesHeaderProps } from "@/types/updates/model";
import { cn } from "@/lib/utils";
import { UPDATES_FOCUS_CLASS } from "./updatesDocStyles";

export function UpdatesHeader({ release, onClose }: UpdatesHeaderProps) {
  const { t } = useTranslation(),
    locale = useI18nStore((state) => state.locale);
  const version = release ? release.version : UPDATES.currentVersion;
  return (
    <header className="relative shrink-0 pt-[30px] pr-15 pb-[18px] pl-9 max-[440px]:pl-5">
      <p className="mt-0 mb-2.5 font-(family-name:--doc-font-ui) text-[12px] font-semibold tracking-[0.06em] text-(--doc-accent)">
        {t("updates.title")}
      </p>
      <DialogTitle className="leading-1.16 m-0 font-(family-name:--doc-font-body) text-[1.84rem] font-semibold text-(--doc-heading)">
        <a
          className={cn(
            "text-inherit no-underline hover:text-(--doc-accent-hover) hover:underline hover:underline-offset-[0.15em]",
            UPDATES_FOCUS_CLASS,
          )}
          href={UPDATES_CHANGELOG_URL}
          target="_blank"
          rel="noopener noreferrer"
          title={t("updates.fullHistory")}
        >
          {version ? `Scopify v${version}` : t("updates.unreleased")}
        </a>
      </DialogTitle>
      <DialogDescription className="mt-2 font-(family-name:--doc-font-ui) text-[13px] leading-(--text-sm--line-height) text-(--doc-muted)">
        {release?.date ? (
          <time dateTime={release.date}>
            {new Intl.DateTimeFormat(locale, { dateStyle: "long", timeZone: "UTC" }).format(
              new Date(`${release.date}T00:00:00Z`),
            )}
          </time>
        ) : (
          t(version ? "updates.noDate" : "updates.unreleasedHint")
        )}
      </DialogDescription>
      <button
        type="button"
        className={cn(
          "absolute top-5 right-5 grid size-[30px] cursor-pointer place-items-center rounded-[8px] text-(--doc-muted) hover:bg-(--doc-hover) hover:text-(--doc-heading)",
          UPDATES_FOCUS_CLASS,
        )}
        onClick={onClose}
        aria-label={t("updates.closeLabel")}
      >
        <X size={18} aria-hidden />
      </button>
    </header>
  );
}
