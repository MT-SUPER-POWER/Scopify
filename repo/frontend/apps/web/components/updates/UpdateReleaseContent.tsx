"use client";

import { UPDATES_PAGE_SIZE, UPDATE_COMMIT_URL } from "@/constants/updates";
import { UPDATE_CATEGORIES } from "@/constants/updateCategories";
import { useI18n } from "@/store/module/i18n";
import type { UpdateReleaseContentProps } from "@/types/updates";
import styles from "./WhatsNewModal.module.css";

export function UpdateReleaseContent({ release, page, onPageChange }: UpdateReleaseContentProps) {
  const { locale, t } = useI18n();
  const sortedEntries = UPDATE_CATEGORIES.flatMap((category) =>
    release.entries.filter((entry) => entry.category === category.title),
  );
  const entries = sortedEntries.slice(page * UPDATES_PAGE_SIZE, (page + 1) * UPDATES_PAGE_SIZE);

  return (
    <div className={styles.content}>
      {!entries.length ? <p>{t("updates.empty")}</p> : null}
      {UPDATE_CATEGORIES.map((category) => {
        const items = entries.filter((entry) => entry.category === category.title);
        const categoryTotal = release.entries.filter(
          (entry) => entry.category === category.title,
        ).length;
        if (!categoryTotal) return null;
        const categoryPage = Math.floor(
          sortedEntries.findIndex((entry) => entry.category === category.title) / UPDATES_PAGE_SIZE,
        );
        return (
          <details key={category.title} className={styles.article} open>
            <summary className={styles.sectionTitle}>
              {category.title}
              <span className={styles.categoryCount}>
                {!items.length || items.length === categoryTotal
                  ? categoryTotal
                  : `${items.length} / ${categoryTotal}`}
              </span>
            </summary>
            {!items.length ? (
              <button
                type="button"
                className={styles.categoryJump}
                onClick={() => onPageChange(categoryPage)}
              >
                {t("updates.viewCategoryPage", { page: categoryPage + 1 })}
              </button>
            ) : null}
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
                        <span
                          className={styles.pending}
                          title={
                            entry.commitStatus === "unresolved"
                              ? t("updates.unresolved")
                              : undefined
                          }
                        >
                          (
                          {t(
                            entry.commitStatus === "unresolved"
                              ? "updates.unresolvedShort"
                              : "updates.pending",
                          )}
                          )
                        </span>
                      )}
                    </summary>
                    <p className={styles.entryDescription}>{entry.description[locale]}</p>
                    {entry.commitStatus === "unresolved" ? (
                      <p className={styles.entryDescription}>{t("updates.unresolved")}</p>
                    ) : null}
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
