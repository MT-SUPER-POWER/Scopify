"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { FaGithub } from "react-icons/fa6";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@scopify/ui/shadcn/components/select";
import { UPDATES } from "@/constants/updates";
import { useI18n } from "@/store/module/i18n";
import type { UpdatesFooterProps } from "@/types/updates";
import styles from "./WhatsNewModal.module.css";

export function UpdatesFooter({
  version,
  page,
  total,
  onVersionChange,
  onPageChange,
}: UpdatesFooterProps) {
  const { t } = useI18n();
  return (
    <footer className={styles.footer}>
      <div className={styles.footerGroup}>
        <a
          className={styles.projectLink}
          href="https://github.com/MT-SUPER-POWER/Scopify"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Scopify · GitHub"
        >
          <FaGithub size={16} aria-hidden />
          <span className={styles.projectName}>Scopify</span>
        </a>
        <Select value={version} onValueChange={onVersionChange}>
          <SelectTrigger
            size="sm"
            className={styles.versionTrigger}
            aria-label={t("updates.version")}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent className={styles.versionMenu} side="top" position="popper">
            {!UPDATES.releases.some((item) => item.version === UPDATES.currentVersion) ? (
              <SelectItem value={UPDATES.currentVersion}>v{UPDATES.currentVersion}</SelectItem>
            ) : null}
            {UPDATES.releases.map((item) => (
              <SelectItem key={item.version} value={item.version}>
                v{item.version}
                {item.version === UPDATES.currentVersion ? ` · ${t("updates.current")}` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <nav className={styles.footerGroup} aria-label={t("updates.page", { page: page + 1, total })}>
        <button
          type="button"
          className={styles.footerButton}
          disabled={page === 0}
          onClick={() => onPageChange(page - 1)}
          aria-label={t("updates.previous")}
        >
          <ChevronLeft size={16} aria-hidden />
        </button>
        <span className={styles.pageLabel} aria-live="polite">
          {page + 1} / {total}
        </span>
        <button
          type="button"
          className={styles.footerButton}
          disabled={page + 1 >= total}
          onClick={() => onPageChange(page + 1)}
          aria-label={t("updates.next")}
        >
          <ChevronRight size={16} aria-hidden />
        </button>
      </nav>
    </footer>
  );
}
