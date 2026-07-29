import type { RawSongDetail } from "@/types/api/music";

export interface RadioHost {
  avatarUrl?: string;
  nickname?: string;
  userId?: number;
}

export interface RadioDetail {
  category?: string;
  createTime?: number;
  desc?: string;
  dj?: RadioHost | null;
  id: number;
  lastProgramCreateTime?: number;
  latestEpisodeName?: string;
  name: string;
  newVoiceCount?: number;
  picUrl?: string;
  playCount?: number;
  programCount?: number;
  secondCategory?: string;
  subCount?: number;
}

export type RadioDetailPayload = RadioDetail | { djRadio?: RadioDetail };

export interface RadioProgram {
  coverUrl?: string;
  createTime?: number;
  description?: string;
  dj?: RadioHost;
  duration?: number;
  id: number;
  listenerCount?: number;
  mainSong: RawSongDetail;
  name?: string;
  radio?: RadioDetail;
}

export interface RadioDetailResponse {
  code: number;
  data?: RadioDetailPayload;
  djRadio?: RadioDetail;
  message?: string | null;
}

export interface RadioProgramsResponse {
  code: number;
  data?: {
    more?: boolean;
    programs?: RadioProgram[];
  };
  message?: string | null;
  more?: boolean;
  programs?: RadioProgram[];
}

export interface RadioProgramsParams {
  id: number | string;
  limit?: number;
  offset?: number;
}

export interface RadioSublistResponse {
  code: number;
  count?: number;
  data?: {
    count?: number;
    djRadios?: RadioDetail[];
    hasMore?: boolean;
  };
  djRadios?: RadioDetail[];
  hasMore?: boolean;
  message?: string | null;
}

export interface RadioSubscriptionResponse {
  code: number;
  message?: string | null;
}
