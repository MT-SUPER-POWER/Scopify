"use client";

import { X } from "lucide-react";
import { DialogDescription, DialogTitle } from "@scopify/ui/shadcn/components/dialog";
import { UPDATES, UPDATES_CHANGELOG_URL } from "@/constants/updates";
import { useI18n } from "@/store/module/i18n";
import type { UpdatesHeaderProps } from "@/types/updates";
import styles from "./WhatsNewModal.module.css";

export function UpdatesHeader({ release, onClose }: UpdatesHeaderProps) {
  const { locale, t } = useI18n();
  const version = release ? release.version : UPDATES.currentVersion;
  return (
    <header className={styles.header}>
      <p className={styles.eyebrow}>{t("updates.title")}</p>
      <DialogTitle className={styles.title}>
        <a
          className={styles.titleLink}
          href={UPDATES_CHANGELOG_URL}
          target="_blank"
          rel="noopener noreferrer"
          title={t("updates.fullHistory")}
        >
          {version ? `Scopify v${version}` : t("updates.unreleased")}
        </a>
      </DialogTitle>
      <DialogDescription className={styles.date}>
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
        className={styles.close}
        onClick={onClose}
        aria-label={t("updates.closeLabel")}
      >
        <X size={18} aria-hidden />
      </button>
    </header>
  );
}
