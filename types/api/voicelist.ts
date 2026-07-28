export interface SubscribedVoiceList {
  categoryName?: string;
  coverUrl?: string;
  createTime?: number;
  desc?: string;
  lastProgramCreateTime?: number;
  newVoiceCount?: number;
  pinned?: boolean;
  playCount?: number;
  secondCategoryName?: string;
  subCount?: number;
  userId?: number;
  userName?: string;
  voiceCount?: number;
  voiceId?: number;
  voiceListId: number;
  voiceListName: string;
  voiceName?: string;
}

export interface SubscribedVoiceListsResponse {
  code: number;
  data?: {
    count?: number;
    data?: SubscribedVoiceList[];
    hasMore?: boolean;
  };
  message?: string | null;
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

export interface RecommendedPodcast {
  category?: string;
  coverUrl?: string;
  dj?: {
    nickname?: string;
  };
  id: number;
  name: string;
  picUrl?: string;
  playCount?: number;
  programCount?: number;
  subCount?: number;
}

export interface RecommendedPodcastsResponse {
  code: number;
  data?:
    | RecommendedPodcast[]
    | {
        data?: RecommendedPodcast[];
        djRadios?: RecommendedPodcast[];
        radios?: RecommendedPodcast[];
        recommend?: RecommendedPodcast[];
      };
  djRadios?: RecommendedPodcast[];
  message?: string | null;
}

export interface RecommendedVoiceArtist {
  id?: number;
  name?: string;
  picUrl?: string;
}

export interface RecommendedVoiceAlbum {
  blurPicUrl?: string;
  id?: number;
  name?: string;
  picUrl?: string;
}

export interface RecommendedVoiceSong {
  al?: RecommendedVoiceAlbum;
  album?: RecommendedVoiceAlbum;
  ar?: RecommendedVoiceArtist[];
  artists?: RecommendedVoiceArtist[];
  dt?: number;
  duration?: number;
  id?: number;
  name?: string;
}

export interface RecommendedVoice {
  duration?: number;
  djProgram?: {
    dj?: {
      nickname?: string;
    };
    mainSong?: RecommendedVoiceSong;
  };
  id?: number;
  name?: string;
  picUrl?: string;
  radioName?: string;
}

export interface RecommendedVoiceListsResponse {
  code: number;
  data?: {
    recommendVoiceVOS?: RecommendedVoice[];
  };
}

export interface LikedVoice {
  contentCoverUrl?: string;
  contentId?: number | string;
  contentName?: string;
  coverUrl?: string;
  dj?: {
    nickname?: string;
  };
  djProgram?: {
    dj?: {
      nickname?: string;
    };
    mainSong?: RecommendedVoiceSong;
  };
  duration?: number;
  id?: number | string;
  mainSong?: RecommendedVoiceSong;
  name?: string;
  picUrl?: string;
  radioName?: string;
  userName?: string;
  voiceId?: number | string;
  voiceListName?: string;
  voiceName?: string;
}

export interface LikedVoicesResponse {
  code: number;
  contentVOList?: LikedVoice[];
  data?:
    | LikedVoice[]
    | {
        contentList?: LikedVoice[];
        contentVOList?: LikedVoice[];
        data?: LikedVoice[];
        list?: LikedVoice[];
      };
  message?: string | null;
}

export interface VoiceDetail {
  coverUrl?: string;
  description?: string;
  duration?: number;
  id?: number;
  name?: string;
  voiceListId?: number;
}

export interface VoiceDetailResponse {
  code: number;
  data?: VoiceDetail | null;
  message?: string;
}

export interface VoiceLyricResponse {
  code: number;
  data?: {
    lyricUrl?: string;
    source?: string | null;
  };
}

export interface VoiceLyricSentence {
  beg: number;
  end: number;
  name: string;
  speaker?: string;
}

export interface VoiceLyricDocument {
  duration?: number;
  sents?: VoiceLyricSentence[];
}

export interface VoiceListDetail {
  category?: string;
  coverUrl?: string;
  description?: string;
  id?: number;
  name?: string;
  picUrl?: string;
}

export interface VoiceListDetailResponse {
  code: number;
  data?: VoiceListDetail | null;
  message?: string;
}
