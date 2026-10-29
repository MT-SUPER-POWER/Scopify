import { getAritstDetail } from "@/lib/api/artist";
import { getAlbumDetail } from "@/lib/api/album";
import { getMVDetail } from "@/lib/api/mv";
import { getPlaylsitDetail } from "@/lib/api/playlist";
import { getRadioDetail, getRadioProgramDetail } from "@/lib/api/radio";
import { getSongDetail } from "@/lib/api/track";
import { getVoiceDetail } from "@/lib/api/voicelist";
import { getMvCover } from "@/lib/music/mvCover";
import type { CommentResourceKind } from "@/types/comment/api";
import type { CommentResourceHeaderData } from "@/types/comment/model";
import type { SongDetail } from "@/types/song/api";

const FALLBACK_COVER =
  "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=1000&auto=format&fit=crop";
const artistAvatarCache = new Map<string, string>();

function getArtistAvatar(source: Record<string, unknown> | undefined) {
  for (const key of ["avatar", "avatarUrl", "img1v1Url", "picUrl", "cover"]) {
    const value = source?.[key];
    if (typeof value === "string" && value) return value;
  }
  return "";
}

async function getSongHeader(resourceId: string): Promise<CommentResourceHeaderData> {
  const response = await getSongDetail(resourceId);
  const song = response.data?.songs?.[0] as SongDetail | undefined;
  const artists = await Promise.all(
    (song?.ar ?? []).map(async (artist) => {
      const cacheKey = String(artist.id);
      let avatarUrl = artistAvatarCache.get(cacheKey) ?? "";
      if (!avatarUrl) {
        try {
          const artistResponse = await getAritstDetail(artist.id);
          avatarUrl = getArtistAvatar(
            artistResponse.data?.data?.artist as unknown as Record<string, unknown> | undefined,
          );
          if (avatarUrl) artistAvatarCache.set(cacheKey, avatarUrl);
        } catch {
          // Artist artwork is supplementary; comments remain usable without it.
        }
      }
      return { avatarUrl, id: artist.id, name: artist.name };
    }),
  );

  return {
    albumName: song?.al?.name,
    artists,
    coverUrl: song?.al?.picUrl || FALLBACK_COVER,
    title: song?.name ?? "",
  };
}

async function getPlaylistHeader(resourceId: string): Promise<CommentResourceHeaderData> {
  const response = await getPlaylsitDetail({ id: resourceId });
  const playlist = response.data?.playlist;
  return {
    albumName: playlist?.creator?.nickname,
    artists: [],
    coverUrl: playlist?.coverImgUrl ?? playlist?.picUrl ?? FALLBACK_COVER,
    title: playlist?.name ?? "",
  };
}

async function getAlbumHeader(resourceId: string): Promise<CommentResourceHeaderData> {
  const response = await getAlbumDetail(resourceId);
  const album = response.data?.album;
  const artists = album?.artists ?? (album?.artist ? [album.artist] : []);
  return {
    artists: artists.map((artist) => ({
      avatarUrl: artist.picUrl ?? artist.img1v1Url ?? "",
      id: artist.id ?? "",
      name: artist.name ?? "",
    })),
    coverUrl: album?.picUrl ?? album?.blurPicUrl ?? FALLBACK_COVER,
    title: album?.name ?? "",
  };
}

async function getVoiceHeader(resourceId: string): Promise<CommentResourceHeaderData> {
  try {
    const response = await getRadioProgramDetail(resourceId);
    const program = response.data?.program;
    if (program) {
      return {
        albumName: program.radio?.name ?? program.dj?.nickname,
        artists: [],
        coverUrl: program.coverUrl ?? FALLBACK_COVER,
        title: program.name ?? program.mainSong?.name ?? "",
      };
    }
  } catch {
    // New Voice resources can fall back to the login-aware detail endpoint.
  }

  const response = await getVoiceDetail(resourceId);
  const voice = response.data?.data;
  return {
    artists: [],
    coverUrl: voice?.coverUrl || FALLBACK_COVER,
    title: voice?.name ?? "",
  };
}

async function getVoiceListHeader(resourceId: string): Promise<CommentResourceHeaderData> {
  const response = await getRadioDetail(resourceId);
  const payload = response.data?.data;
  const radio = payload && "id" in payload ? payload : payload?.djRadio;
  return {
    albumName: radio?.dj?.nickname,
    artists: [],
    coverUrl: radio?.picUrl ?? FALLBACK_COVER,
    title: radio?.name ?? "",
  };
}

async function getMvHeader(resourceId: string): Promise<CommentResourceHeaderData> {
  const mv = (await getMVDetail(resourceId)).data?.data;
  const artists = mv?.artists?.length
    ? mv.artists
    : mv?.artistId
      ? [{ id: mv.artistId, name: mv.artistName ?? "" }]
      : [];
  return {
    artists: artists.map((artist) => ({
      avatarUrl: "img1v1Url" in artist ? (artist.img1v1Url ?? "") : "",
      id: artist.id,
      name: artist.name,
    })),
    coverUrl: (mv && getMvCover(mv)) || FALLBACK_COVER,
    title: mv?.name ?? "",
  };
}

/** 评论页头部要显示的资源信息（封面、标题、歌手），按资源类型取对应的详情接口。 */
export function getCommentResourceHeader(
  kind: CommentResourceKind,
  resourceId: string,
): Promise<CommentResourceHeaderData> {
  switch (kind) {
    case "mv":
      return getMvHeader(resourceId);
    case "album":
      return getAlbumHeader(resourceId);
    case "playlist":
      return getPlaylistHeader(resourceId);
    case "voice":
      return getVoiceHeader(resourceId);
    case "voice-list":
      return getVoiceListHeader(resourceId);
    default:
      return getSongHeader(resourceId);
  }
}
