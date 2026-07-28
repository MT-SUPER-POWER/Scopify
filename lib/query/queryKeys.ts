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
  library: {
    collection: (userId: number) => ["library", "collection", userId] as const,
    createdPodcasts: (userId: number) => ["library", "podcasts", "created", userId] as const,
    likedVoices: (userId: number) => ["library", "podcasts", "liked-voices", userId] as const,
    likedPlaylist: (userId: number) => ["library", "liked-playlist", userId] as const,
    recentSongs: (userId: number) => ["library", "recent-songs", userId] as const,
    recommendedPodcasts: (userId: number) =>
      ["library", "podcasts", "recommendations", userId] as const,
    subscribedPodcasts: (userId: number) =>
      ["library", "podcasts", "subscribed", "v2", userId] as const,
  },
  playlist: {
    content: (playlistId: string, isRecommend: boolean) =>
      ["playlist", "content", "playlist", playlistId, isRecommend] as const,
    daily: (date: string) => ["playlist", "content", "daily", date] as const,
  },
  radio: {
    content: (radioId: string) => ["radio", "content", radioId] as const,
  },
  search: {
    albums: (keyword: string, limit: number) => ["search", "albums", keyword, limit] as const,
    artists: (keyword: string, limit: number) => ["search", "artists", keyword, limit] as const,
    complex: (keyword: string) => ["search", "complex", keyword] as const,
    playlists: (keyword: string, limit: number) => ["search", "playlists", keyword, limit] as const,
    songs: (keyword: string, limit: number) => ["search", "songs", keyword, limit] as const,
  },
  voice: {
    transcript: (voiceId: number) => ["voice", "transcript", voiceId] as const,
  },
} as const;
