"use client";

import { BookOpen } from "lucide-react";
import { QueryBoundary } from "@/components/shared/QueryBoundary";
import { QueryPending } from "@/components/shared/QueryPending";
import { QuietState } from "@/components/shared/QuietState";
import { useAuth } from "@/hooks/auth/useAuth";
import { useSongWikiQuery } from "@/hooks/song/useSongResources";
import { useI18n } from "@/store/module/i18n";
import type { SongResourceSectionProps } from "@/types/components/songResources";

export function SongWikiSection(props: SongResourceSectionProps) {
  const { userId, isAuthenticated } = useAuth();
  return (
    <QueryBoundary
      compact
      resetKey={`song-wiki:${props.songId}:${isAuthenticated ? userId : "guest"}`}
    >
      <SongWikiContent {...props} />
    </QueryBoundary>
  );
}
function SongWikiContent({ songId, compact }: SongResourceSectionProps) {
  const { t } = useI18n();
  const query = useSongWikiQuery(songId);
  if (songId <= 0)
    return <QuietState compact icon={BookOpen} title={t("songResources.emptyWiki")} />;
  if (query.data === undefined) return <QueryPending isPaused={query.fetchStatus === "paused"} />;
  if (query.data.length === 0)
    return <QuietState compact icon={BookOpen} title={t("songResources.emptyWiki")} />;
  return (
    <div className="space-y-5">
      {query.data.map((section) => (
        <section key={section.id}>
          <h4 className="mb-2 text-sm font-medium text-content">{section.title}</h4>
          {section.description ? (
            <p
              className={
                compact
                  ? "line-clamp-4 text-sm leading-6 text-content-muted"
                  : "text-sm leading-7 whitespace-pre-wrap text-content-muted"
              }
            >
              {section.description}
            </p>
          ) : null}
          <dl className="mt-2 space-y-2">
            {(compact ? section.fields.slice(0, 4) : section.fields).map((field, index) => (
              <div
                key={`${field.label}-${index}`}
                className="flex items-start gap-4 text-xs leading-5"
              >
                <dt className="w-16 shrink-0 text-content-subtle">{field.label}</dt>
                <dd className="min-w-0 flex-1 break-words text-content-muted">{field.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </div>
  );
}
