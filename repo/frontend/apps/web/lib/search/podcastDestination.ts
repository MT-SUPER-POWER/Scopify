import type { Podcast } from "@/types/search";

export function getPodcastDestination({ id }: Pick<Podcast, "id" | "source">) {
  return `/radio?id=${id}`;
}
