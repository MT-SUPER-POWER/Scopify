"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@scopify/ui/shadcn/components/select";
import { UPDATES, UPDATES_UNRELEASED_KEY } from "@/constants/updates";
import { useI18n } from "@/store/module/i18n";
import type { UpdatesFooterProps } from "@/types/updates/model";
import styles from "./WhatsNewModal.module.css";

export function UpdatesFooter({ releaseKey, onReleaseChange, onClose }: UpdatesFooterProps) {
  const { t } = useI18n();
  return (
    <footer className={styles.footer}>
      <div className={styles.footerGroup}>
        <Select value={releaseKey} onValueChange={onReleaseChange}>
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
              <SelectItem
                key={item.version ?? UPDATES_UNRELEASED_KEY}
                value={item.version ?? UPDATES_UNRELEASED_KEY}
              >
                {item.version ? `v${item.version}` : t("updates.unreleased")}
                {item.version === UPDATES.currentVersion ? ` · ${t("updates.current")}` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <button type="button" className={styles.done} onClick={onClose}>
        {t("updates.close")}
      </button>
    </footer>
  );
}
