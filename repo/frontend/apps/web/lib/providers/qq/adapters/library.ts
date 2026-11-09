import type { MusicAccountRef } from "@scopify/music-domain/identity";
import type {
  MusicCloudEntry,
  MusicLibraryAlbum,
  MusicLibraryPlaylist,
  MusicListeningRankEntry,
} from "@scopify/music-domain/library";
import type { MusicPlaylistVisibility } from "@scopify/music-domain/playlist";

import { adaptQqPlaylistSong, qqAlbumCoverUrl } from "@/lib/providers/qq/adapters/playlist";
import { readQqRawTrack } from "@/lib/providers/qq/adapters/track";
import type {
  QqCloudDto,
  QqLibraryAlbumEntryDto,
  QqLibraryPlaylistEntryDto,
  QqListeningRankDto,
} from "@/types/providers/qq/libraryApi";

/** The directory number of the built-in "liked songs" inside an account. */
export const QQ_LIKED_DIR_ID = 201;

/** QQ still hands out some artwork over plain HTTP; every image host serves HTTPS too. */
function secureUrl(url: string | undefined): string | null {
  return url ? url.replace(/^http:\/\//, "https://") : null;
}

function firstText(...values: (string | undefined)[]): string {
  return values.find((value) => value !== undefined && value.trim() !== "")?.trim() ?? "";
}

/** The creator's account number; public reads report "0" for it. */
function creatorAccountId(uin: QqLibraryPlaylistEntryDto["uin"]): string | null {
  const value = typeof uin === "number" ? String(uin) : (uin ?? "");
  return /^\d+$/.test(value) && Number(value) > 0 ? value : null;
}

function visibilityOf(dirShow: number | undefined): MusicPlaylistVisibility | null {
  if (dirShow === 1) return "public";
  if (dirShow === 0 || dirShow === 2) return "private";
  return null;
}

/**
 * Created playlists come from `GetPlaylistByUin` and name the playlist `dirName`; saved ones
 * come from the favourites list and name it `name`. The creator's account number, when the
 * read reports it, settles the same question.
 */
export function adaptQqLibraryPlaylist(
  raw: QqLibraryPlaylistEntryDto,
  account: MusicAccountRef,
): MusicLibraryPlaylist {
  const creatorId = creatorAccountId(raw.uin);
  const created = creatorId !== null ? creatorId === account.accountId : raw.dirName !== undefined;
  const creatorName = firstText(raw.nick, raw.nickname);
  return {
    playlist: {
      ref: { provider: "qq", kind: "playlist", id: String(raw.tid) },
      title: firstText(raw.dirName, raw.name, raw.dissname),
      coverUrl: secureUrl(
        firstText(raw.picUrl, raw.bigpicUrl, raw.logo, raw.albumPicUrl) || undefined,
      ),
      creator: creatorName
        ? {
            account: creatorId ? { provider: "qq", accountId: creatorId } : null,
            name: creatorName,
            avatarUrl: secureUrl(raw.headurl),
          }
        : null,
      trackCount: raw.songNum ?? raw.songnum ?? 0,
      playCount: null,
    },
    relation: created ? "created" : "subscribed",
    isLikedList: created && raw.dirId === QQ_LIKED_DIR_ID,
    visibility: visibilityOf(raw.dirShow),
  };
}

/** A saved album; an entry without an identity cannot be opened or listed, so it is left out. */
export function adaptQqLibraryAlbum(raw: QqLibraryAlbumEntryDto): MusicLibraryAlbum | null {
  const mid = firstText(raw.albummid, raw.album_mid, raw.albumMid);
  const title = firstText(raw.albumname, raw.album_name, raw.albumName);
  if (!mid || !title) return null;
  const savedAt = raw.ordertime ?? raw.order_time;
  const artist = firstText(raw.singername, raw.singer_name);
  return {
    album: {
      ref: { provider: "qq", kind: "album", id: mid },
      title,
      coverUrl: secureUrl(firstText(raw.picurl, raw.pic) || undefined) ?? qqAlbumCoverUrl(mid),
    },
    artistNames: artist ? [artist] : [],
    trackCount: raw.songnum ?? raw.song_num ?? null,
    savedAt: savedAt ? savedAt * 1000 : null,
  };
}

/** Cloud entries that matched a catalog song; uploads without a match have no track to show. */
export function adaptQqCloudEntries(raw: QqCloudDto["data"]): MusicCloudEntry[] {
  return raw.flatMap((entry) => {
    const dto = readQqRawTrack(entry.song);
    if (!dto) return [];
    return [
      {
        track: adaptQqPlaylistSong(dto),
        fileName: entry.fileName,
        addedAt: entry.addTime,
        playable: entry.playable,
      },
    ];
  });
}

export function adaptQqListeningRank(raw: QqListeningRankDto["items"]): MusicListeningRankEntry[] {
  return raw.flatMap((item) => {
    const dto = readQqRawTrack(item.track);
    return dto
      ? [{ track: adaptQqPlaylistSong(dto), listenCount: Math.max(0, item.listenCount) }]
      : [];
  });
}
