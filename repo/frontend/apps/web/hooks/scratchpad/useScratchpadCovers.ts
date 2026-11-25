import { useMemo } from "react";
import { usePlayerStore } from "@/store/module/player";
import { getSizedImageUrl } from "@/lib/music/imageUrl";

export function useScratchpadCovers(limit: number) {
  const queue = usePlayerStore((s) => s.queue);
  const index = usePlayerStore((s) => s.queueIndex);
  return useMemo(() => {
    const covers: string[] = [];
    for (let i = Math.max(0, index + 1); i < queue.length && covers.length < limit; i++) {
      const url = queue[i].album?.coverUrl;
      if (url) covers.push(getSizedImageUrl(url, 160));
    }
    return covers;
  }, [queue, index, limit]);
}
