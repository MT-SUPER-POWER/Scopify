import type { RawSongDetail } from "@/types/api/music";

export interface RecentSongHistoryEntry {
  data?: RawSongDetail;
  playTime?: number;
  resourceInfo?: {
    songData?: RawSongDetail;
  };
  song?: RawSongDetail;
}

export interface RecentSongsResponse {
  code: number;
  data?: {
    list?: RecentSongHistoryEntry[];
  };
  list?: RecentSongHistoryEntry[];
}

export interface DjRadio {
  category?: string;
  categoryId?: number;
  dj?: {
    nickname?: string;
  };
  id: number;
  name: string;
  picUrl?: string;
  programCount?: number;
  subCount?: number;
}

export interface DjSublistResponse {
  code: number;
  djRadios?: DjRadio[];
  hasMore?: boolean;
}

export interface CreatedVoiceList {
  coverUrl?: string;
  creator?: {
    nickname?: string;
  };
  id: number;
  name: string;
  picUrl?: string;
  voiceCount?: number;
}

export interface CreatedVoiceListsResponse {
  code: number;
  data?: CreatedVoiceList[] | { data?: CreatedVoiceList[]; list?: CreatedVoiceList[] };
  list?: CreatedVoiceList[];
}
