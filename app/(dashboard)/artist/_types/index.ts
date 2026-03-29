// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ TYPES ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface Track {
  id: string | number;
  title: string;
  durationMs: number;
  ar: Array<{ id: string | number; name: string }>;
  al: {
    blurPicUrl?: string;
    coverUrl?: string;
    picUrl: string;
  }
  publishTime?: number;
  dt: number;
  raw?: unknown;
}

export interface Album {
  id: string | number;
  title: string;
  releaseYear: number;
  type: string;
  coverUrl: string;
}

export interface ArtistInfo {
  id: string | number;
  name: string;
  isVerified: boolean;
  listeners: number;
  headerImageUrl: string;
  avatar: string;
  bio: string;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ UTILS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const formatNumber = (num: number) =>
  new Intl.NumberFormat("en-US").format(num);

export const formatDuration = (ms: number) => {
  if (!ms) return "0:00";
  const minutes = Math.floor(ms / 60000);
  const seconds = ((ms % 60000) / 1000).toFixed(0);
  return `${minutes}:${Number(seconds) < 10 ? "0" : ""}${seconds}`;
};
