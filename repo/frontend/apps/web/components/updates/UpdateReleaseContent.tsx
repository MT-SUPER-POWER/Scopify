"use client";

import { UPDATES_PAGE_SIZE, UPDATE_COMMIT_URL } from "@/constants/updates";
import { UPDATE_CATEGORIES } from "@/constants/updateCategories";
import { useI18n } from "@/store/module/i18n";
import type { UpdateReleaseContentProps } from "@/types/updates";
import styles from "./WhatsNewModal.module.css";

export function UpdateReleaseContent({ release, page }: UpdateReleaseContentProps) {
  const { locale, t } = useI18n();
  const entries = UPDATE_CATEGORIES.flatMap((category) =>
    release.entries.filter((entry) => entry.category === category.title),
  ).slice(page * UPDATES_PAGE_SIZE, (page + 1) * UPDATES_PAGE_SIZE);

  return (
    <div className={styles.content}>
      {!entries.length ? <p>{t("updates.empty")}</p> : null}
      {UPDATE_CATEGORIES.map((category) => {
        const items = entries.filter((entry) => entry.category === category.title);
        if (!items.length) return null;
        return (
          <details key={category.title} className={styles.article} open>
            <summary className={styles.sectionTitle}>
              {category.title}
              <span className={styles.categoryCount}>{items.length}</span>
            </summary>
            <ul className={styles.entries}>
              {items.map((entry) => (
                <li key={entry.id} className={styles.entry}>
                  <details className={styles.entryDetails}>
                    <summary className={styles.entrySummary}>
                      {entry.title[locale]}{" "}
                      {entry.commit ? (
                        <a
                          className={styles.commit}
                          href={`${UPDATE_COMMIT_URL}${entry.commit}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          ({entry.commit.slice(0, 8)})
                        </a>
                      ) : (
                        <span className={styles.pending}>({t("updates.pending")})</span>
                      )}
                    </summary>
                    <p className={styles.entryDescription}>{entry.description[locale]}</p>
                  </details>
                </li>
              ))}
            </ul>
          </details>
        );
      })}
    </div>
  );
}
