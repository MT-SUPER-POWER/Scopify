"use client";

import { X } from "lucide-react";
import { DialogDescription, DialogTitle } from "@scopify/ui/shadcn/components/dialog";
import { useI18n } from "@/store/module/i18n";
import type { UpdatesHeaderProps } from "@/types/updates";
import styles from "./WhatsNewModal.module.css";

export function UpdatesHeader({ version, release, onClose }: UpdatesHeaderProps) {
  const { locale, t } = useI18n();
  return (
    <header className={styles.header}>
      <DialogTitle className={styles.title}>{t("updates.title")}</DialogTitle>
      <button
        type="button"
        className={styles.close}
        onClick={onClose}
        aria-label={t("updates.close")}
      >
        <X size={22} strokeWidth={1.5} aria-hidden />
      </button>
      <DialogDescription asChild>
        {release?.date ? (
          <time dateTime={release.date} className={styles.date}>
            {new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: "UTC" }).format(
              new Date(`${release.date}T00:00:00Z`),
            )}
          </time>
        ) : (
          <span className={styles.date}>v{version}</span>
        )}
      </DialogDescription>
    </header>
  );
}
