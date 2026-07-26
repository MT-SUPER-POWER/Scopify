import { useI18n } from "@/store/module/i18n";
import type { PodcastsViewProps } from "@/types/components/search";
import { PodcastCard } from "./PodcastCard";

export function PodcastsView({ podcasts }: PodcastsViewProps) {
  const { t } = useI18n();

  return (
    <div className="pb-10">
      <h2 className="mb-6 text-2xl font-bold tracking-tight">
        {t("search.section.searchPodcasts")}
      </h2>
      {podcasts.length > 0 ? (
        <div className="grid w-full min-w-0 grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-6">
          {podcasts.map((podcast) => (
            <PodcastCard key={podcast.id} podcast={podcast} />
          ))}
        </div>
      ) : (
        <p className="py-8 text-center text-sm text-zinc-500">
          {t("search.section.noPodcastResults")}
        </p>
      )}
    </div>
  );
}
