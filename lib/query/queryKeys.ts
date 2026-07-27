export const musicQueryKeys = {
  album: {
    detail: (albumId: string) => ["album", "detail", albumId] as const,
  },
  artist: {
    albums: (artistId: string) => ["artist", "albums", artistId] as const,
    detail: (artistId: string) => ["artist", "detail", artistId] as const,
    followCount: (artistId: string) => ["artist", "follow-count", artistId] as const,
    topSongs: (artistId: string) => ["artist", "top-songs", artistId] as const,
  },
  home: {
    banners: () => ["home", "banners"] as const,
    collectedAlbums: () => ["home", "collected-albums"] as const,
    hotArtists: () => ["home", "hot-artists"] as const,
    personalizedPlaylists: () => ["home", "personalized-playlists"] as const,
    recommendedPlaylists: () => ["home", "recommended-playlists"] as const,
    userProfile: (userId: string) => ["home", "user-profile", userId] as const,
  },
  playlist: {
    content: (playlistId: string, isRecommend: boolean) =>
      ["playlist", "content", "playlist", playlistId, isRecommend] as const,
    daily: (date: string) => ["playlist", "content", "daily", date] as const,
  },
  search: {
    albums: (keyword: string, limit: number) => ["search", "albums", keyword, limit] as const,
    artists: (keyword: string, limit: number) => ["search", "artists", keyword, limit] as const,
    complex: (keyword: string) => ["search", "complex", keyword] as const,
    playlists: (keyword: string, limit: number) => ["search", "playlists", keyword, limit] as const,
    songs: (keyword: string, limit: number) => ["search", "songs", keyword, limit] as const,
  },
} as const;
