import type { Podcast } from "@/types/search/model";

export function getPodcastDestination({ id }: Pick<Podcast, "id" | "source">) {
  return `/radio?id=${id}`;
}
