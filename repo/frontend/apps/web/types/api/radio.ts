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
  djPlayRecordVo?: null | RadioProgramPlayRecord;
  duration?: number;
  id: number;
  listenerCount?: number;
  mainSong: RawSongDetail;
  name?: string;
  radio?: RadioDetail;
}

/** 登录用户在一个电台节目中的云端收听断点，时间均为毫秒。 */
export interface RadioProgramPlayRecord {
  id: number;
  isListened: boolean;
  listenLocation: number;
  uploadTime: number;
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
  asc?: boolean;
  id: number | string;
  limit?: number;
  offset?: number;
  updateOrder?: boolean;
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
