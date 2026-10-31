"use client";

import { UPDATE_COMMIT_URL } from "@/constants/updates";
import { UPDATE_GROUPS } from "@/constants/updateCategories";
import { useTranslation } from "react-i18next";

import type { UpdateReleaseContentProps } from "@/types/updates/model";
import styles from "./WhatsNewModal.module.css";

export function UpdateReleaseContent({ release }: UpdateReleaseContentProps) {
  const { t } = useTranslation();
  return (
    <article className={styles.content}>
      {UPDATE_GROUPS.map((group) => {
        const entries = release.entries.filter((entry) => entry.group === group.id);
        if (!entries.length) return null;
        return (
          <section key={group.id} className={styles.group}>
            <h3 className={styles.groupTitle}>
              {t(`updates.${group.id}`)}
              <span className={styles.groupCount}>{entries.length}</span>
            </h3>
            <ul className={styles.entries}>
              {entries.map((entry) => (
                <li key={entry.commit} className={styles.entry}>
                  {entry.text}{" "}
                  <a
                    className={styles.commit}
                    href={`${UPDATE_COMMIT_URL}${entry.commit}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={t("updates.viewCommit", { hash: entry.commit.slice(0, 8) })}
                  >
                    {entry.commit.slice(0, 7)}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </article>
  );
}
