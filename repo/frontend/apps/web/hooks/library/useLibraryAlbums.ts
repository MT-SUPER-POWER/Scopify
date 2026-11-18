"use client";

import { useQuery } from "@tanstack/react-query";

import { useLibraryAccount } from "@/hooks/library/useLibraryAccount";
import { useProviderCapability } from "@/hooks/provider/useActiveProvider";
import { musicQueryKeys } from "@/lib/query/queryKeys";
import type { LibraryMediaItem } from "@/types/library/model";

/**
 * Albums the account saved on the active platform, shaped for the library grid. Albums open
 * only on platforms that have album pages; elsewhere they are shown without a link.
 */
export function useLibraryAlbumsQuery() {
  const { account, provider } = useLibraryAccount();
  const canOpenAlbum = useProviderCapability("album.read");
  return useQuery({
    enabled: account !== null && provider.getLibraryAlbums !== undefined,
    queryKey: musicQueryKeys.library.albums(provider.provider, account?.accountId ?? ""),
    queryFn: async ({ signal }): Promise<LibraryMediaItem[]> => {
      if (!account || !provider.getLibraryAlbums) throw new Error("Missing account.");
      const albums = await provider.getLibraryAlbums(account, { signal });
      return albums.map((item) => ({
        coverUrl: item.album.coverUrl ?? undefined,
        date: item.savedAt ?? undefined,
        href: canOpenAlbum ? `/album?id=${item.album.ref.id}` : undefined,
        id: item.album.ref.id,
        subtitle:
          item.trackCount !== null
            ? `${item.trackCount} 首歌曲`
            : item.artistNames.length > 0
              ? item.artistNames.join(" / ")
              : undefined,
        title: item.album.title,
      }));
    },
  });
}
