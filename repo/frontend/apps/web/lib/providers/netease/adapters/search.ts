import type { MusicPlaylist } from "@scopify/music-domain/playlist";
import type {
  MusicAlbumResult,
  MusicArtistResult,
  MusicSearchBestMatch,
  MusicSearchHighlight,
  MusicSearchOverview,
  MusicSearchSuggestion,
} from "@scopify/music-domain/search";
import type { MusicArtist } from "@scopify/music-domain/track";

import { adaptNeteaseTrack } from "@/lib/providers/netease/adapters/track";
import type {
  ComplexSearchAlbumData,
  ComplexSearchResource,
  ComplexSearchResponse,
  NeteaseSuggestItemDto,
  SearchArtistSource,
  SearchResultAlbum,
  SearchResultArtist,
  SearchResultPlaylist,
  SongSearchData,
} from "@/types/providers/netease/searchApi";
import type { NeteaseMusicTrack } from "@/types/providers/netease/trackApi";

/** What an overview carries beyond the interface types: the NetEase-only podcast and voice blocks. */
export interface NeteaseSearchOverviewExtras {
  /** The unmapped reply; podcasts and voices are read from it where they are shown. */
  readonly response: ComplexSearchResponse;
}

export type NeteaseSearchOverview = MusicSearchOverview & {
  readonly netease: NeteaseSearchOverviewExtras;
};

function isValidPicUrl(url: string | null | undefined): url is string {
  return typeof url === "string" && url.startsWith("http");
}

function adaptArtistRef(source: { id?: number; name?: string }): MusicArtist {
  return {
    ref: { provider: "netease", kind: "artist", id: String(source.id ?? 0) },
    name: source.name ?? "",
  };
}

export function adaptNeteaseSearchArtist(
  source: SearchArtistSource | SearchResultArtist,
): MusicArtistResult {
  return {
    ...adaptArtistRef(source),
    // A picture address that is not a full URL is treated as no picture, then the square one.
    avatarUrl: (isValidPicUrl(source.picUrl) ? source.picUrl : null) || source.img1v1Url || null,
    aliases: source.alias ?? [],
  };
}

export function adaptNeteaseSearchAlbum(
  source: ComplexSearchAlbumData | SearchResultAlbum,
): MusicAlbumResult {
  const artist = source.artist ?? ("artists" in source ? source.artists?.[0] : undefined);
  return {
    ref: { provider: "netease", kind: "album", id: String(source.id) },
    title: source.name,
    coverUrl: source.picUrl || source.blurPicUrl || null,
    artists: artist ? [adaptArtistRef(artist)] : [],
    publishedAt: source.publishTime ?? null,
  };
}

export function adaptNeteaseSearchPlaylist(source: SearchResultPlaylist): MusicPlaylist {
  return {
    ref: { provider: "netease", kind: "playlist", id: String(source.id) },
    title: source.name,
    coverUrl: source.coverImgUrl || null,
    creator: source.creator
      ? { account: null, name: source.creator.nickname, avatarUrl: null }
      : null,
    trackCount: source.trackCount ?? 0,
    playCount: source.playCount ?? null,
  };
}

export function adaptNeteaseSearchSong(source: SongSearchData): NeteaseMusicTrack {
  const albumPicUrl = isValidPicUrl(source.al?.picUrl)
    ? source.al.picUrl
    : isValidPicUrl(source.al?.blurPicUrl)
      ? source.al.blurPicUrl
      : "";
  const mv = source.mv || source.mvid;
  return adaptNeteaseTrack({
    id: source.id,
    name: source.name ?? "",
    dt: source.dt ?? 0,
    ar: (source.ar ?? []).map((artist) => ({ id: artist.id, name: artist.name })),
    al: { id: source.al?.id ?? 0, name: source.al?.name ?? "", picUrl: albumPicUrl },
    alia: source.alia ?? source.alias ?? [],
    fee: source.fee ?? 0,
    ...(mv ? { mv } : {}),
  });
}

function findBlockResources(response: ComplexSearchResponse, blockCode: string) {
  return response.data?.blocks?.find((block) => block.blockCode === blockCode)?.resources ?? [];
}

function adaptBestMatch(resource: ComplexSearchResource): MusicSearchBestMatch | null {
  switch (resource.resourceType) {
    case "album": {
      const album = resource.baseInfo?.albumData;
      return album ? { kind: "album", album: adaptNeteaseSearchAlbum(album) } : null;
    }
    case "artist": {
      const artist = resource.baseInfo?.artistDTO;
      return artist ? { kind: "artist", artist: adaptNeteaseSearchArtist(artist) } : null;
    }
    case "playlist": {
      const playlist = resource.baseInfo?.pubPlaylistData;
      return playlist ? { kind: "playlist", playlist: adaptNeteaseSearchPlaylist(playlist) } : null;
    }
    case "song": {
      const song = resource.baseInfo?.simpleSongData;
      return song ? { kind: "song", song: adaptNeteaseSearchSong(song) } : null;
    }
    default:
      return null;
  }
}

/** The song, artist, album and playlist blocks and the best match of a complex search. */
export function adaptNeteaseSearchOverview(response: ComplexSearchResponse): NeteaseSearchOverview {
  return {
    bestMatch:
      findBlockResources(response, "search_block_best_match")
        .map(adaptBestMatch)
        .find((match): match is MusicSearchBestMatch => match !== null) ?? null,
    songs: findBlockResources(response, "search_block_song").flatMap((resource) => {
      const song = resource.baseInfo?.simpleSongData;
      return song ? [adaptNeteaseSearchSong(song)] : [];
    }),
    artists: findBlockResources(response, "search_block_artist").flatMap((resource) => {
      const artist = resource.baseInfo?.artistDTO;
      return artist ? [adaptNeteaseSearchArtist(artist)] : [];
    }),
    albums: findBlockResources(response, "search_block_album").flatMap((resource) => {
      const album = resource.baseInfo?.albumData;
      return album ? [adaptNeteaseSearchAlbum(album)] : [];
    }),
    playlists: findBlockResources(response, "search_block_playlist").flatMap((resource) => {
      const playlist = resource.baseInfo?.pubPlaylistData;
      return playlist ? [adaptNeteaseSearchPlaylist(playlist)] : [];
    }),
    netease: { response },
  };
}

interface NeteaseHighlightSegment {
  text?: unknown;
  highLighted?: unknown;
}

function parseHighlights(raw: string): MusicSearchHighlight[] | null {
  try {
    const segments: unknown = JSON.parse(raw);
    if (!Array.isArray(segments)) return null;
    return segments.flatMap((segment: NeteaseHighlightSegment) =>
      typeof segment?.text === "string"
        ? [{ text: segment.text, matched: segment.highLighted === true }]
        : [],
    );
  } catch {
    return null;
  }
}

export function adaptNeteaseSuggestion(item: NeteaseSuggestItemDto): MusicSearchSuggestion {
  const highlights = parseHighlights(item.highLightInfo);
  const hasTag = Boolean(item.tag || item.tagUrl);
  return {
    keyword: item.keyword,
    highlights: highlights ?? [{ text: item.highLightInfo || item.keyword, matched: false }],
    tag: hasTag
      ? {
          label: item.tag,
          imageUrl: item.tagUrl,
          emphasized: item.skinType === "colorPrimary1",
        }
      : null,
  };
}
