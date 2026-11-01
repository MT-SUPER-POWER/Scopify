"use client";

import { UPDATE_COMMIT_URL } from "@/constants/updates";
import { UPDATE_GROUPS } from "@/constants/updateCategories";
import { useTranslation } from "react-i18next";

import type { UpdateReleaseContentProps } from "@/types/updates/model";
import { cn } from "@/lib/utils";
import { UPDATES_FOCUS_CLASS } from "./updatesDocStyles";

export function UpdateReleaseContent({ release }: UpdateReleaseContentProps) {
  const { t } = useTranslation();
  return (
    <article className="leading-1.62 px-9 pt-1.5 pb-7 text-[16px] max-[440px]:px-5">
      {UPDATE_GROUPS.map((group) => {
        const entries = release.entries.filter((entry) => entry.group === group.id);
        if (!entries.length) return null;
        return (
          <section key={group.id}>
            <h3 className="leading-1.32 mt-[1.2rem] mb-2 flex items-baseline gap-2.5 font-(family-name:--doc-font-body) text-[1.24em] font-semibold text-(--doc-heading)">
              {t(`updates.${group.id}`)}
              <span className="font-(family-name:--doc-font-ui) text-[12px] font-normal text-(--doc-muted) tabular-nums">
                {entries.length}
              </span>
            </h3>
            <ul className="m-0 list-disc pl-[1.45rem]">
              {entries.map((entry) => (
                <li
                  key={entry.commit}
                  className="pl-[0.15rem] not-first:mt-[0.3em] marker:text-(--doc-muted)"
                >
                  {entry.text}{" "}
                  <a
                    className={cn(
                      // Commit hash as Typora inline code
                      "inline-block rounded-full border border-(--doc-code-border) bg-(--doc-code-bg) px-[0.5em] pt-[0.04em] pb-[0.08em] align-[0.1em] font-(family-name:--doc-font-mono) text-[0.72em] leading-normal whitespace-nowrap text-(--doc-code) no-underline hover:border-(--doc-accent) hover:text-(--doc-accent)",
                      UPDATES_FOCUS_CLASS,
                    )}
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
