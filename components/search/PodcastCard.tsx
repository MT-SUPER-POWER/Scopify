import { ListMusic, Radio } from "lucide-react";
import Image from "next/image";
import { useI18n } from "@/store/module/i18n";
import type { PodcastCardProps } from "@/types/components/search";

const FALLBACK_COVER =
  "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?q=80&w=400&auto=format&fit=crop";

export function PodcastCard({ podcast }: PodcastCardProps) {
  const { t } = useI18n();

  return (
    <article className="min-w-0 rounded-xl bg-[#181818] p-4 transition-colors hover:bg-[#282828]">
      <div className="relative mb-4 aspect-square w-full overflow-hidden rounded-md bg-zinc-800 shadow-lg">
        <Image
          width={300}
          height={300}
          src={podcast.coverUrl || FALLBACK_COVER}
          alt={podcast.name}
          className="size-full object-cover"
        />
        {podcast.category && (
          <span className="absolute right-2 bottom-2 rounded bg-black/70 px-2 py-0.5 text-[11px] font-medium text-white">
            {podcast.category}
          </span>
        )}
      </div>
      <h3 className="truncate text-base font-bold text-white">{podcast.name}</h3>
      <p className="mt-1 truncate text-sm text-zinc-400">
        {podcast.hostName || t("search.podcast.unknownHost")}
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500">
        <span className="inline-flex items-center gap-1">
          <Radio className="size-3" />
          {t("search.podcast.subscriberCount", { count: podcast.subscriberCount })}
        </span>
        <span className="inline-flex items-center gap-1">
          <ListMusic className="size-3" />
          {t("search.podcast.programCount", { count: podcast.programCount })}
        </span>
      </div>
    </article>
  );
}
