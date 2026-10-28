export interface ToplistTrackItem {
  first: string;
  second: string;
}

export interface ToplistDetailItem {
  id: number;
  name: string;
  coverImgUrl: string;
  updateFrequency?: string;
  playCount?: number;
  tracks?: ToplistTrackItem[];
  description?: string;
}

export interface ToplistDetailResponse {
  code: number;
  list?: ToplistDetailItem[];
  artistToplist?: unknown;
}
