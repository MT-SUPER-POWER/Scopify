import type { CommentResourceKind } from "@/types/comment/api";
import type { CommentSortType } from "@/types/comment/model";
import { mvQueryKeys } from "@/lib/query/mvQueryKeys";

export const musicQueryKeys = {
  mv: mvQueryKeys,
  album: {
    detail: (albumId: string) => ["album", "detail", albumId] as const,
    subscriptions: (userId: number) => ["album", "subscriptions", userId] as const,
  },
  artist: {
    albums: (artistId: string) => ["artist", "albums", artistId] as const,
    detail: (artistId: string) => ["artist", "detail", artistId] as const,
    followCount: (artistId: string) => ["artist", "follow-count", artistId] as const,
    topSongs: (artistId: string) => ["artist", "top-songs", artistId] as const,
    fansGroup: (artistId: string | number) => ["fans-group", "artist", String(artistId)] as const,
  },
  fansGroup: {
    userGroups: (userId?: number | string) =>
      ["fans-group", "user-groups", String(userId ?? "")] as const,
    detail: (groupId: number | string) => ["fans-group", "detail", String(groupId)] as const,
  },
  home: {
    banners: () => ["home", "banners"] as const,
    hotArtists: (limit = 50) => ["home", "hot-artists", limit] as const,
    newAlbums: (limit = 20) => ["home", "new-albums", limit] as const,
    newSongs: (limit = 12) => ["home", "new-songs", limit] as const,
    personalizedPlaylists: (limit = 100) => ["home", "personalized-playlists", limit] as const,
    recommendedPlaylists: (accountId: number | string) =>
      ["home", "recommended-playlists", String(accountId)] as const,
    recommendedVoiceLists: (limit = 24) => ["home", "recommended-voice-lists", limit] as const,
    toplists: () => ["home", "toplists"] as const,
    toplistTracks: (id: number | string) => ["home", "toplist-tracks", id] as const,
    recentPlaylists: (limit: number, accountId: number | string) =>
      ["home", "recent-playlists", String(accountId), limit] as const,
    followedArtists: (limit: number, accountId: number | string) =>
      ["home", "followed-artists", String(accountId), limit] as const,
    followedArtistAlbums: (limit: number, accountId: number | string) =>
      ["home", "followed-artist-albums", String(accountId), limit] as const,
    userProfile: (userId: string) => ["home", "user-profile", userId] as const,
  },
  library: {
    cloud: (userId: number) => ["library", "cloud", userId] as const,
    collection: (userId: number) => ["library", "collection", userId] as const,
    createdPodcasts: (userId: number) => ["library", "podcasts", "created", userId] as const,
    likedVoices: (userId: number) => ["library", "podcasts", "liked-voices", userId] as const,
    likedPlaylist: (userId: number) => ["library", "liked-playlist", userId] as const,
    likedSongIds: (userId: number) => ["library", "liked-song-ids", userId] as const,
    playlists: (userId: number) => ["library", "playlists", userId] as const,
    recentSongs: (userId: number) => ["library", "recent-songs", userId] as const,
    recommendedPodcasts: (userId: number) =>
      ["library", "podcasts", "recommendations", userId] as const,
    subscribedPodcasts: (userId: number) =>
      ["library", "podcasts", "subscribed", "v2", userId] as const,
  },
  listeningReport: {
    period: (userId: number, period: "month" | "week" | "year", endTime?: number) =>
      ["listening-report", "period", userId, period, endTime ?? 0] as const,
    realtime: (userId: number, period: "month" | "week") =>
      ["listening-report", "realtime", userId, period] as const,
    songRank: (userId: number, period: "month" | "week", endTime?: number) =>
      ["listening-report", "song-rank", userId, period, endTime ?? 0] as const,
    todaySongs: (userId: number) => ["listening-report", "today-songs", userId] as const,
    total: (userId: number) => ["listening-report", "total", userId] as const,
  },
  comment: {
    count: (kind: CommentResourceKind | "unknown", resourceId: string) =>
      ["comment", "count", kind, resourceId] as const,
    hotPreview: (songId: number, limit: number, accountId: string) =>
      ["comment", "hot-preview", songId, limit, accountId] as const,
    header: (kind: CommentResourceKind, resourceId: string) =>
      ["comment", "header", kind, resourceId] as const,
    /** 一个资源下的全部评论数据（列表与各层楼的回复）共用的前缀；点赞、删除、发表据此批量更新。 */
    thread: (accountId: string, kind: CommentResourceKind, resourceId: string) =>
      ["comment", "thread", accountId, kind, resourceId] as const,
    list: (
      accountId: string,
      kind: CommentResourceKind,
      resourceId: string,
      sort: CommentSortType,
    ) => [...musicQueryKeys.comment.thread(accountId, kind, resourceId), "list", sort] as const,
    replies: (accountId: string, kind: CommentResourceKind, resourceId: string, rootId: number) =>
      [...musicQueryKeys.comment.thread(accountId, kind, resourceId), "replies", rootId] as const,
  },
  playlist: {
    content: (playlistId: string, isRecommend: boolean) =>
      ["playlist", "content", "playlist", playlistId, isRecommend] as const,
    daily: (date: string) => ["playlist", "content", "daily", date] as const,
  },
  radio: {
    content: (radioId: string) => ["radio", "content", radioId] as const,
    subscriptions: (userId: number) => ["radio", "subscriptions", userId] as const,
  },
  search: {
    albums: (keyword: string, limit: number) => ["search", "albums", keyword, limit] as const,
    artists: (keyword: string, limit: number) => ["search", "artists", keyword, limit] as const,
    /** 云盘匹配与歌词匹配共用：搜歌并转成匹配候选。 */
    matchCandidates: (keyword: string, limit: number) =>
      ["search", "match-candidates", keyword, limit] as const,
    complex: (keyword: string) => ["search", "complex", keyword] as const,
    lyrics: (keyword: string, limit: number) => ["search", "lyrics", keyword, limit] as const,
    mvs: (keyword: string, limit: number) => ["search", "mvs", keyword, limit] as const,
    playlists: (keyword: string, limit: number) => ["search", "playlists", keyword, limit] as const,
    songs: (keyword: string, limit: number) => ["search", "songs", keyword, limit] as const,
    suggest: (keyword: string) => ["search", "suggest", keyword] as const,
    voices: (keyword: string, limit: number) => ["search", "voices", keyword, limit] as const,
    voiceLists: (keyword: string, limit: number) =>
      ["search", "voice-lists", keyword, limit] as const,
  },
  lyrics: {
    matchOverride: (songId: number) => ["lyrics", "match-override", songId] as const,
    matchPreview: (songId: number) => ["lyrics", "match-preview", songId] as const,
    /** 本地保存的导入歌词与当前歌词来源（在线 / 导入）。 */
    source: (songId: number) => ["lyrics", "source", songId] as const,
  },
  song: {
    wiki: (songId: number, userId: number) => ["song", "wiki", songId, userId] as const,
    sheets: (songId: number) => ["song", "sheets", songId] as const,
    sheetPreview: (sheetId: number, userId: number) =>
      ["song", "sheet-preview", userId, sheetId] as const,
    similar: (songId: number, userId: number) => ["song", "similar", userId, songId] as const,
    chorus: (songId: number | string) => ["song", "chorus", songId] as const,
    dynamicCover: (songId: number | string) => ["song", "dynamic-cover", songId] as const,
    mvId: (songId: number) => ["song", "mv-id", songId] as const,
  },
  user: {
    medal: (userId: number | string) => ["user", "medal", String(userId)] as const,
    socialStatus: (userId: number | string) => ["user", "social-status", String(userId)] as const,
    socialStatusSupport: () => ["user", "social-status", "support"] as const,
    socialStatusRcmd: () => ["user", "social-status", "rcmd"] as const,
  },
  voice: {
    transcript: (voiceId: number) => ["voice", "transcript", voiceId] as const,
  },
} as const;
