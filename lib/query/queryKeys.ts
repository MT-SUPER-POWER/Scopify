export const musicQueryKeys = {
  album: {
    detail: (albumId: string) => ["album", "detail", albumId] as const,
  },
} as const;
